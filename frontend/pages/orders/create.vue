<script setup lang="ts">
import { orderFormSchema } from "~/schemas/order";
import type { Customer } from "~/types/customer";
import type { Product } from "~/types/product";
import type { SelectOption } from "~/types/ui";

definePageMeta({ middleware: "auth" });
useHead({ title: "Create order · Shop Admin" });

// The backend caps list pages at 100 rows, which is enough for this shop's catalogue
const OPTIONS_LIMIT = 100;

type OrderLine = {
  key: number;
  productId: number | null;
  quantity: number | null;
};

const { listCustomers } = useCustomers();
const { listProducts } = useProducts();
const { createOrder } = useOrders();

const customers = ref<Customer[]>([]);
const products = ref<Product[]>([]);
const loadingOptions = ref(true);
const loadError = ref("");

async function loadOptions() {
  loadingOptions.value = true;
  loadError.value = "";

  try {
    const [customerResponse, productResponse] = await Promise.all([
      listCustomers({ page: 1, limit: OPTIONS_LIMIT }),
      listProducts({ page: 1, limit: OPTIONS_LIMIT }),
    ]);
    customers.value = customerResponse.data;
    products.value = productResponse.data;
  } catch (error) {
    loadError.value = error instanceof ApiError ? error.message : "Could not load customers and products.";
  } finally {
    loadingOptions.value = false;
  }
}

onMounted(loadOptions);

// Form state
const customerId = ref<number | null>(null);
let nextLineKey = 1;
const lines = ref<OrderLine[]>([{ key: nextLineKey++, productId: null, quantity: 1 }]);
const fieldErrors = ref<FieldErrors>({});
const formError = ref("");
const submitting = ref(false);

const productsById = computed(() => new Map(products.value.map((product) => [product.id, product])));

const customerOptions = computed<SelectOption[]>(() =>
  customers.value.map((customer) => ({
    value: customer.id,
    label: customer.phone ? `${customer.name} · ${customer.phone}` : customer.name,
  })),
);

// Each line can pick any product not already used by another line, and nothing out of stock
function productOptionsFor(line: OrderLine): SelectOption[] {
  const usedElsewhere = new Set(
    lines.value.filter((other) => other.key !== line.key).map((other) => other.productId),
  );

  return products.value.map((product) => ({
    value: product.id,
    label: `${product.product_code} · ${product.name}${product.stock === 0 ? " (out of stock)" : ""}`,
    disabled: product.stock === 0 || usedElsewhere.has(product.id),
  }));
}

function isWholeQuantity(quantity: number | null): quantity is number {
  return typeof quantity === "number" && Number.isInteger(quantity) && quantity > 0;
}

function lineSubtotal(line: OrderLine) {
  const product = line.productId ? productsById.value.get(line.productId) : undefined;
  if (!product || !isWholeQuantity(line.quantity)) {
    return null;
  }
  return BigInt(product.price) * BigInt(line.quantity);
}

// Preview only: the backend recalculates every amount from its own prices
const totals = computed(() => {
  const subtotal = lines.value.reduce((total, line) => total + (lineSubtotal(line) ?? 0n), 0n);
  return { subtotal, ...calculateDiscountPreview(subtotal) };
});

function addLine() {
  lines.value.push({ key: nextLineKey++, productId: null, quantity: 1 });
}

function removeLine(key: number) {
  lines.value = lines.value.filter((line) => line.key !== key);
  // Field errors are keyed by row position, which has just changed
  fieldErrors.value = {};
}

// Friendly check before submitting; the backend re-checks stock inside its transaction
function findStockErrors() {
  const errors: FieldErrors = {};

  lines.value.forEach((line, index) => {
    const product = line.productId ? productsById.value.get(line.productId) : undefined;
    if (product && isWholeQuantity(line.quantity) && line.quantity > product.stock) {
      errors[`items.${index}.quantity`] = `Only ${product.stock} in stock`;
    }
  });

  return errors;
}

async function submit() {
  formError.value = "";

  const { data, errors } = validateForm(orderFormSchema, {
    customer_id: customerId.value,
    items: lines.value.map((line) => ({ product_id: line.productId, quantity: line.quantity })),
  });

  const stockErrors = findStockErrors();
  fieldErrors.value = { ...stockErrors, ...errors };
  if (!data || Object.keys(stockErrors).length > 0) {
    formError.value = "Please fix the highlighted fields.";
    return;
  }

  submitting.value = true;
  try {
    const response = await createOrder(data);
    await navigateTo({ path: `/orders/${response.data.id}`, query: { created: "1" } });
  } catch (error) {
    if (error instanceof ApiError) {
      fieldErrors.value = toFieldErrors(error.fieldErrors);
      formError.value = error.message;
      // Stock may have changed since the page loaded
      if (error.status === 422) {
        await loadOptions();
      }
    } else {
      formError.value = "Could not create the order.";
    }
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="space-y-6">
    <NuxtLink to="/orders" class="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700">
      <span aria-hidden="true">←</span> Back to orders
    </NuxtLink>

    <div>
      <h1 class="text-2xl font-semibold text-slate-900">Create order</h1>
      <p class="mt-1 text-sm text-slate-500">Choose a customer and the products to order.</p>
    </div>

    <BaseAlert v-if="loadError">
      {{ loadError }}
      <button type="button" class="ml-2 font-medium underline" @click="loadOptions">Try again</button>
    </BaseAlert>

    <p v-if="loadingOptions && products.length === 0" class="py-12 text-center text-sm text-slate-500">Loading…</p>

    <form v-else class="grid gap-6 xl:grid-cols-3" novalidate @submit.prevent="submit">
      <div class="min-w-0 space-y-6 xl:col-span-2">
        <BaseAlert v-if="formError">{{ formError }}</BaseAlert>

        <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 class="mb-4 text-base font-semibold text-slate-900">Customer</h2>
          <BaseSelect
            v-model="customerId"
            label="Customer"
            hide-label
            placeholder="Select a customer"
            :options="customerOptions"
            :error="fieldErrors.customer_id"
          />
          <p v-if="customers.length === 0" class="mt-2 text-sm text-slate-500">
            No customers yet.
            <NuxtLink to="/customers" class="font-medium text-indigo-600 hover:text-indigo-500">Add one first</NuxtLink>.
          </p>
        </section>

        <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-base font-semibold text-slate-900">Products</h2>
            <BaseButton variant="secondary" :disabled="lines.length >= products.length" @click="addLine">
              Add product
            </BaseButton>
          </div>

          <p v-if="fieldErrors.items" class="mb-3 text-sm text-rose-600">{{ fieldErrors.items }}</p>
          <p v-if="lines.length === 0" class="rounded-lg border border-dashed border-slate-300 py-8 text-center text-sm text-slate-500">
            No products added yet.
          </p>

          <ul class="space-y-4">
            <li
              v-for="(line, index) in lines"
              :key="line.key"
              class="rounded-lg border border-slate-200 p-4"
              :class="{ 'border-rose-300 bg-rose-50/40': fieldErrors[`items.${index}.product_id`] || fieldErrors[`items.${index}.quantity`] }"
            >
              <div class="grid gap-4 sm:grid-cols-[1fr_8rem_auto] sm:items-start">
                <BaseSelect
                  v-model="line.productId"
                  :label="`Product ${index + 1}`"
                  placeholder="Select a product"
                  :options="productOptionsFor(line)"
                  :error="fieldErrors[`items.${index}.product_id`]"
                />
                <div>
                  <label :for="`quantity-${line.key}`" class="mb-1.5 block text-sm font-medium text-slate-700">Quantity</label>
                  <input
                    :id="`quantity-${line.key}`"
                    v-model.number="line.quantity"
                    type="number"
                    min="1"
                    step="1"
                    :max="line.productId ? productsById.get(line.productId)?.stock : undefined"
                    class="block w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 focus:outline-2 focus:outline-offset-0"
                    :class="fieldErrors[`items.${index}.quantity`] ? 'border-rose-400 focus:outline-rose-500' : 'border-slate-300 focus:outline-indigo-500'"
                  />
                  <p v-if="fieldErrors[`items.${index}.quantity`]" class="mt-1.5 text-xs text-rose-600">
                    {{ fieldErrors[`items.${index}.quantity`] }}
                  </p>
                </div>
                <div class="sm:pt-7">
                  <BaseButton variant="ghost" :aria-label="`Remove product ${index + 1}`" @click="removeLine(line.key)">
                    Remove
                  </BaseButton>
                </div>
              </div>

              <div v-if="line.productId && productsById.get(line.productId)" class="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600">
                <span>Price: <span class="font-medium text-slate-900">{{ formatRupiah(productsById.get(line.productId)!.price) }}</span></span>
                <span>In stock: <span class="font-medium text-slate-900">{{ productsById.get(line.productId)!.stock }}</span></span>
                <span v-if="lineSubtotal(line) !== null">
                  Subtotal: <span class="font-medium text-slate-900">{{ formatRupiah(lineSubtotal(line)!) }}</span>
                </span>
              </div>
            </li>
          </ul>
        </section>
      </div>

      <aside class="h-fit space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-24">
        <h2 class="text-base font-semibold text-slate-900">Summary</h2>
        <dl class="space-y-2 text-sm">
          <div class="flex justify-between text-slate-600">
            <dt>Subtotal</dt>
            <dd>{{ formatRupiah(totals.subtotal) }}</dd>
          </div>
          <div class="flex justify-between text-slate-600">
            <dt>Discount <span v-if="totals.discountRate > 0n">({{ totals.discountRate }}%)</span></dt>
            <dd class="text-emerald-700">− {{ formatRupiah(totals.discountAmount) }}</dd>
          </div>
          <div class="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold text-slate-900">
            <dt>Grand total</dt>
            <dd>{{ formatRupiah(totals.grandTotal) }}</dd>
          </div>
        </dl>
        <p class="text-xs text-slate-500">
          5% off from Rp500.000 and 10% off from Rp1.000.000, up to Rp150.000. Final amounts are calculated by the
          server when the order is placed.
        </p>
        <BaseButton type="submit" class="w-full" :loading="submitting">Place order</BaseButton>
      </aside>
    </form>
  </div>
</template>
