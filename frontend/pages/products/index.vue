<script setup lang="ts">
import { productFormSchema } from "~/schemas/product";
import type { Pagination } from "~/types/api";
import type { Product } from "~/types/product";
import type { TableColumn } from "~/types/ui";

definePageMeta({ middleware: "auth" });
useHead({ title: "Products · Shop Admin" });

const PAGE_SIZE = 10;
const LOW_STOCK_LIMIT = 5;

const { listProducts, createProduct, updateProduct } = useProducts();

const columns: TableColumn[] = [
  { label: "Code" },
  { label: "Name" },
  { label: "Price", align: "right" },
  { label: "Stock", align: "right" },
  { label: "Updated" },
  { label: "", align: "right" },
];

// List state
const products = ref<Product[]>([]);
const pagination = ref<Pagination>({ page: 1, limit: PAGE_SIZE, total: 0, total_pages: 0 });
const search = ref("");
const loading = ref(true);
const listError = ref("");
const successMessage = ref("");

async function loadProducts(page = pagination.value.page) {
  loading.value = true;
  listError.value = "";

  try {
    const response = await listProducts({ page, limit: PAGE_SIZE, search: search.value.trim() });
    products.value = response.data;
    pagination.value = response.pagination;
  } catch (error) {
    listError.value = error instanceof ApiError ? error.message : "Could not load products.";
  } finally {
    loading.value = false;
  }
}

// Wait until the user stops typing before searching
let searchTimer: ReturnType<typeof setTimeout> | undefined;
watch(search, () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => loadProducts(1), 300);
});

onMounted(() => loadProducts(1));

// Create / edit form state
const formOpen = ref(false);
const editingProduct = ref<Product | null>(null);
const form = reactive({ product_code: "", name: "", price: "", stock: "" });
const fieldErrors = ref<FieldErrors>({});
const formError = ref("");
const saving = ref(false);

function openCreateForm() {
  editingProduct.value = null;
  Object.assign(form, { product_code: "", name: "", price: "", stock: "0" });
  fieldErrors.value = {};
  formError.value = "";
  formOpen.value = true;
}

function openEditForm(product: Product) {
  editingProduct.value = product;
  Object.assign(form, {
    product_code: product.product_code,
    name: product.name,
    price: product.price,
    stock: String(product.stock),
  });
  fieldErrors.value = {};
  formError.value = "";
  formOpen.value = true;
}

async function saveProduct() {
  formError.value = "";

  const { data, errors } = validateForm(productFormSchema, form);
  fieldErrors.value = errors ?? {};
  if (!data) {
    return;
  }

  saving.value = true;
  try {
    if (editingProduct.value) {
      await updateProduct(editingProduct.value.id, data);
      successMessage.value = `Product ${data.product_code} was updated.`;
    } else {
      await createProduct(data);
      successMessage.value = `Product ${data.product_code} was created.`;
    }

    formOpen.value = false;
    await loadProducts(editingProduct.value ? pagination.value.page : 1);
  } catch (error) {
    if (error instanceof ApiError) {
      fieldErrors.value = toFieldErrors(error.fieldErrors);
      formError.value = error.message;
      // The only conflict a product can have is a duplicate code
      if (error.status === 409) {
        fieldErrors.value.product_code = error.message;
      }
    } else {
      formError.value = "Could not save the product.";
    }
  } finally {
    saving.value = false;
  }
}

function stockBadge(stock: number) {
  if (stock === 0) {
    return { label: "Out of stock", classes: "bg-rose-50 text-rose-700 ring-rose-600/20" };
  }
  if (stock <= LOW_STOCK_LIMIT) {
    return { label: "Low", classes: "bg-amber-50 text-amber-700 ring-amber-600/20" };
  }
  return null;
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">Products</h1>
        <p class="mt-1 text-sm text-slate-500">Manage product codes, prices and stock.</p>
      </div>
      <BaseButton @click="openCreateForm">Add product</BaseButton>
    </div>

    <BaseAlert v-if="successMessage" variant="success">{{ successMessage }}</BaseAlert>
    <BaseAlert v-if="listError">
      {{ listError }}
      <button type="button" class="ml-2 font-medium underline" @click="loadProducts()">Try again</button>
    </BaseAlert>

    <section class="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div class="border-b border-slate-200 p-4">
        <div class="max-w-sm">
          <BaseInput v-model="search" label="Search products" type="search" placeholder="Search by name or code" />
        </div>
      </div>

      <BaseTable
        :columns="columns"
        :loading="loading"
        :empty="products.length === 0"
        :empty-text="search ? `No products match “${search}”.` : 'No products yet.'"
      >
        <tr v-for="product in products" :key="product.id" class="hover:bg-slate-50">
          <td class="whitespace-nowrap px-5 py-3 font-mono text-xs text-slate-600">{{ product.product_code }}</td>
          <td class="px-5 py-3 font-medium text-slate-900">{{ product.name }}</td>
          <td class="whitespace-nowrap px-5 py-3 text-right text-slate-900">{{ formatRupiah(product.price) }}</td>
          <td class="whitespace-nowrap px-5 py-3 text-right">
            <span class="font-medium text-slate-900">{{ product.stock }}</span>
            <span
              v-if="stockBadge(product.stock)"
              class="ml-2 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset"
              :class="stockBadge(product.stock)?.classes"
            >
              {{ stockBadge(product.stock)?.label }}
            </span>
          </td>
          <td class="whitespace-nowrap px-5 py-3 text-slate-500">{{ formatDateTime(product.updated_at) }}</td>
          <td class="whitespace-nowrap px-5 py-3 text-right">
            <BaseButton variant="ghost" @click="openEditForm(product)">Edit</BaseButton>
          </td>
        </tr>
      </BaseTable>

      <BasePagination v-if="!loading" :pagination="pagination" @change="loadProducts" />
    </section>

    <BaseModal
      :open="formOpen"
      :title="editingProduct ? 'Edit product' : 'Add product'"
      :description="editingProduct ? `Changes apply to new orders only; past orders keep their prices.` : undefined"
      @close="formOpen = false"
    >
      <form id="product-form" class="space-y-4" novalidate @submit.prevent="saveProduct">
        <BaseAlert v-if="formError">{{ formError }}</BaseAlert>

        <BaseInput v-model="form.product_code" label="Product code" required placeholder="PRD016" :error="fieldErrors.product_code" />
        <BaseInput v-model="form.name" label="Name" required :error="fieldErrors.name" />
        <div class="grid gap-4 sm:grid-cols-2">
          <BaseInput
            v-model="form.price"
            label="Price (Rp)"
            required
            inputmode="numeric"
            placeholder="150000"
            hint="Whole Rupiah, no decimals"
            :error="fieldErrors.price"
          />
          <BaseInput v-model="form.stock" label="Stock" required inputmode="numeric" :error="fieldErrors.stock" />
        </div>
      </form>

      <template #footer>
        <BaseButton variant="secondary" @click="formOpen = false">Cancel</BaseButton>
        <BaseButton type="submit" form="product-form" :loading="saving">
          {{ editingProduct ? "Save changes" : "Create product" }}
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
