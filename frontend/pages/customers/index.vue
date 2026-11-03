<script setup lang="ts">
import { customerFormSchema } from "~/schemas/customer";
import type { Pagination } from "~/types/api";
import type { Customer } from "~/types/customer";
import type { TableColumn } from "~/types/ui";

definePageMeta({ middleware: "auth" });
useHead({ title: "Customers · Shop Admin" });

const PAGE_SIZE = 10;

const { listCustomers, createCustomer } = useCustomers();

const columns: TableColumn[] = [
  { label: "Name" },
  { label: "Email" },
  { label: "Phone" },
  { label: "Address" },
  { label: "Added" },
];

// List state
const customers = ref<Customer[]>([]);
const pagination = ref<Pagination>({ page: 1, limit: PAGE_SIZE, total: 0, total_pages: 0 });
const search = ref("");
const loading = ref(true);
const listError = ref("");
const successMessage = ref("");

async function loadCustomers(page = pagination.value.page) {
  loading.value = true;
  listError.value = "";

  try {
    const response = await listCustomers({ page, limit: PAGE_SIZE, search: search.value.trim() });
    customers.value = response.data;
    pagination.value = response.pagination;
  } catch (error) {
    listError.value = error instanceof ApiError ? error.message : "Could not load customers.";
  } finally {
    loading.value = false;
  }
}

let searchTimer: ReturnType<typeof setTimeout> | undefined;
watch(search, () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => loadCustomers(1), 300);
});

onMounted(() => loadCustomers(1));

// Create form state
const formOpen = ref(false);
const form = reactive({ name: "", email: "", phone: "", address: "" });
const fieldErrors = ref<FieldErrors>({});
const formError = ref("");
const saving = ref(false);

function openCreateForm() {
  Object.assign(form, { name: "", email: "", phone: "", address: "" });
  fieldErrors.value = {};
  formError.value = "";
  formOpen.value = true;
}

async function saveCustomer() {
  formError.value = "";

  const { data, errors } = validateForm(customerFormSchema, form);
  fieldErrors.value = errors ?? {};
  if (!data) {
    return;
  }

  saving.value = true;
  try {
    const response = await createCustomer(data);
    successMessage.value = `Customer ${response.data.name} was added.`;
    formOpen.value = false;

    // Show the new customer: clearing the search reloads the list through the search watcher
    if (search.value) {
      search.value = "";
    } else {
      await loadCustomers(1);
    }
  } catch (error) {
    if (error instanceof ApiError) {
      fieldErrors.value = toFieldErrors(error.fieldErrors);
      formError.value = error.message;
    } else {
      formError.value = "Could not save the customer.";
    }
  } finally {
    saving.value = false;
  }
}

const addressId = useId();
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">Customers</h1>
        <p class="mt-1 text-sm text-slate-500">People and businesses you sell to.</p>
      </div>
      <BaseButton @click="openCreateForm">Add customer</BaseButton>
    </div>

    <BaseAlert v-if="successMessage" variant="success">{{ successMessage }}</BaseAlert>
    <BaseAlert v-if="listError">
      {{ listError }}
      <button type="button" class="ml-2 font-medium underline" @click="loadCustomers()">Try again</button>
    </BaseAlert>

    <section class="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div class="border-b border-slate-200 p-4">
        <div class="max-w-sm">
          <BaseInput v-model="search" label="Search customers" type="search" placeholder="Search by name, email or phone" />
        </div>
      </div>

      <BaseTable
        :columns="columns"
        :loading="loading"
        :empty="customers.length === 0"
        :empty-text="search ? `No customers match “${search}”.` : 'No customers yet.'"
      >
        <tr v-for="customer in customers" :key="customer.id" class="hover:bg-slate-50">
          <td class="whitespace-nowrap px-5 py-3 font-medium text-slate-900">{{ customer.name }}</td>
          <td class="whitespace-nowrap px-5 py-3 text-slate-600">{{ customer.email ?? "—" }}</td>
          <td class="whitespace-nowrap px-5 py-3 text-slate-600">{{ customer.phone ?? "—" }}</td>
          <td class="min-w-56 px-5 py-3 text-slate-600">{{ customer.address ?? "—" }}</td>
          <td class="whitespace-nowrap px-5 py-3 text-slate-500">{{ formatDateTime(customer.created_at) }}</td>
        </tr>
      </BaseTable>

      <BasePagination v-if="!loading" :pagination="pagination" @change="loadCustomers" />
    </section>

    <BaseModal :open="formOpen" title="Add customer" @close="formOpen = false">
      <form id="customer-form" class="space-y-4" novalidate @submit.prevent="saveCustomer">
        <BaseAlert v-if="formError">{{ formError }}</BaseAlert>

        <BaseInput v-model="form.name" label="Name" required :error="fieldErrors.name" />
        <div class="grid gap-4 sm:grid-cols-2">
          <BaseInput v-model="form.email" label="Email" type="email" inputmode="email" :error="fieldErrors.email" />
          <BaseInput v-model="form.phone" label="Phone" type="tel" inputmode="tel" placeholder="0812…" :error="fieldErrors.phone" />
        </div>
        <div>
          <label :for="addressId" class="mb-1.5 block text-sm font-medium text-slate-700">Address</label>
          <textarea
            :id="addressId"
            v-model="form.address"
            rows="3"
            class="block w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 focus:outline-2 focus:outline-offset-0"
            :class="fieldErrors.address ? 'border-rose-400 focus:outline-rose-500' : 'border-slate-300 focus:outline-indigo-500'"
          />
          <p v-if="fieldErrors.address" class="mt-1.5 text-xs text-rose-600">{{ fieldErrors.address }}</p>
        </div>
      </form>

      <template #footer>
        <BaseButton variant="secondary" @click="formOpen = false">Cancel</BaseButton>
        <BaseButton type="submit" form="customer-form" :loading="saving">Add customer</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
