<script setup lang="ts">
import type { Pagination } from "~/types/api";
import type { OrderStatus, OrderSummary } from "~/types/order";
import type { SelectOption, TableColumn } from "~/types/ui";

definePageMeta({ middleware: "auth" });
useHead({ title: "Orders · Shop Admin" });

const PAGE_SIZE = 10;
const ORDER_STATUSES: OrderStatus[] = ["PENDING", "PAID", "CANCELLED"];

const { listOrders } = useOrders();
const route = useRoute();
const router = useRouter();

const columns: TableColumn[] = [
  { label: "Invoice" },
  { label: "Customer" },
  { label: "Date" },
  { label: "Total", align: "right" },
  { label: "Status" },
];

const statusOptions: SelectOption[] = [
  { value: "", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "PAID", label: "Paid" },
  { value: "CANCELLED", label: "Cancelled" },
];

// Filters live in the URL so they survive reloads and can be linked to (e.g. from the dashboard)
function readQueryString(key: string) {
  const value = route.query[key];
  return typeof value === "string" ? value : "";
}

const filters = reactive({
  status: readQueryString("status"),
  start_date: readQueryString("start_date"),
  end_date: readQueryString("end_date"),
});
const page = computed(() => Number(readQueryString("page")) || 1);

const orders = ref<OrderSummary[]>([]);
const pagination = ref<Pagination>({ page: 1, limit: PAGE_SIZE, total: 0, total_pages: 0 });
const loading = ref(true);
const errorMessage = ref("");

const dateRangeError = computed(() =>
  filters.start_date && filters.end_date && filters.start_date > filters.end_date
    ? "The start date must be on or before the end date."
    : "",
);

async function loadOrders() {
  if (dateRangeError.value) {
    return;
  }

  loading.value = true;
  errorMessage.value = "";

  const status = ORDER_STATUSES.find((value) => value === filters.status);

  try {
    const response = await listOrders({
      page: page.value,
      limit: PAGE_SIZE,
      status,
      start_date: filters.start_date || undefined,
      end_date: filters.end_date || undefined,
    });
    orders.value = response.data;
    pagination.value = response.pagination;
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : "Could not load orders.";
  } finally {
    loading.value = false;
  }
}

function updateQuery(newPage: number) {
  router.replace({
    query: {
      status: filters.status || undefined,
      start_date: filters.start_date || undefined,
      end_date: filters.end_date || undefined,
      page: newPage > 1 ? String(newPage) : undefined,
    },
  });
}

// Changing a filter starts again from page 1
watch(filters, () => updateQuery(1));
watch(
  () => route.query,
  () => {
    // Ignore the route change that happens while navigating away from this page
    if (route.path === "/orders") {
      loadOrders();
    }
  },
);
onMounted(loadOrders);

const hasFilters = computed(() => Boolean(filters.status || filters.start_date || filters.end_date));

function clearFilters() {
  Object.assign(filters, { status: "", start_date: "", end_date: "" });
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">Orders</h1>
        <p class="mt-1 text-sm text-slate-500">Dates follow Jakarta time (WIB).</p>
      </div>
      <NuxtLink to="/orders/create" class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
        Create order
      </NuxtLink>
    </div>

    <BaseAlert v-if="errorMessage">
      {{ errorMessage }}
      <button type="button" class="ml-2 font-medium underline" @click="loadOrders">Try again</button>
    </BaseAlert>

    <section class="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div class="grid gap-4 border-b border-slate-200 p-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
        <BaseSelect v-model="filters.status" label="Status" :options="statusOptions" />
        <BaseInput v-model="filters.start_date" label="From" type="date" :error="dateRangeError" />
        <BaseInput v-model="filters.end_date" label="To" type="date" />
        <div>
          <BaseButton v-if="hasFilters" variant="ghost" @click="clearFilters">Clear filters</BaseButton>
        </div>
      </div>

      <BaseTable
        :columns="columns"
        :loading="loading"
        :empty="orders.length === 0"
        :empty-text="hasFilters ? 'No orders match these filters.' : 'No orders yet.'"
      >
        <tr v-for="order in orders" :key="order.id" class="hover:bg-slate-50">
          <td class="whitespace-nowrap px-5 py-3 font-medium">
            <NuxtLink :to="`/orders/${order.id}`" class="text-indigo-600 hover:text-indigo-500">
              {{ order.order_number }}
            </NuxtLink>
          </td>
          <td class="whitespace-nowrap px-5 py-3 text-slate-700">{{ order.customer.name }}</td>
          <td class="whitespace-nowrap px-5 py-3 text-slate-500">{{ formatDateTime(order.created_at) }}</td>
          <td class="whitespace-nowrap px-5 py-3 text-right font-medium text-slate-900">
            {{ formatRupiah(order.grand_total) }}
          </td>
          <td class="whitespace-nowrap px-5 py-3"><OrderStatusBadge :status="order.status" /></td>
        </tr>
      </BaseTable>

      <BasePagination v-if="!loading" :pagination="pagination" @change="updateQuery" />
    </section>
  </div>
</template>
