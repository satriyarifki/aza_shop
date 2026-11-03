<script setup lang="ts">
import type { ApiPaginatedResponse } from "~/types/api";
import type { OrderSummary } from "~/types/order";

definePageMeta({ middleware: "auth" });
useHead({ title: "Dashboard · Shop Admin" });

type Summary = {
  products: number;
  customers: number;
  orders: number;
  pendingOrders: number;
};

const summary = ref<Summary | null>(null);
const recentOrders = ref<OrderSummary[]>([]);
const loading = ref(true);
const errorMessage = ref("");

// The list endpoints already return a total, so one tiny page per resource is enough for the counts
function countOf(path: string, query: Record<string, string | number> = {}) {
  return apiRequest<ApiPaginatedResponse<unknown>>(path, { query: { ...query, limit: 1 } }).then(
    (response) => response.pagination.total,
  );
}

async function loadDashboard() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const [products, customers, orders, pendingOrders, latestOrders] = await Promise.all([
      countOf("/products"),
      countOf("/customers"),
      countOf("/orders"),
      countOf("/orders", { status: "PENDING" }),
      apiRequest<ApiPaginatedResponse<OrderSummary>>("/orders", { query: { limit: 5 } }),
    ]);

    summary.value = { products, customers, orders, pendingOrders };
    recentOrders.value = latestOrders.data;
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : "Could not load the dashboard.";
  } finally {
    loading.value = false;
  }
}

onMounted(loadDashboard);

const statCards = computed(() => [
  { label: "Products", value: summary.value?.products, to: "/products" },
  { label: "Customers", value: summary.value?.customers, to: "/customers" },
  { label: "Orders", value: summary.value?.orders, to: "/orders" },
  { label: "Pending orders", value: summary.value?.pendingOrders, to: "/orders?status=PENDING" },
]);
</script>

<template>
  <div class="space-y-8">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p class="mt-1 text-sm text-slate-500">An overview of your shop.</p>
      </div>
      <NuxtLink
        to="/orders/create"
        class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
      >
        Create order
      </NuxtLink>
    </div>

    <BaseAlert v-if="errorMessage">
      {{ errorMessage }}
      <button type="button" class="ml-2 font-medium underline" @click="loadDashboard">Try again</button>
    </BaseAlert>

    <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <NuxtLink
        v-for="card in statCards"
        :key="card.label"
        :to="card.to"
        class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-indigo-300"
      >
        <p class="text-sm font-medium text-slate-500">{{ card.label }}</p>
        <p class="mt-2 text-3xl font-semibold text-slate-900">
          <span v-if="loading" class="inline-block h-8 w-12 animate-pulse rounded bg-slate-200" />
          <template v-else>{{ card.value ?? "—" }}</template>
        </p>
      </NuxtLink>
    </div>

    <section class="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div class="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <h2 class="text-base font-semibold text-slate-900">Recent orders</h2>
        <NuxtLink to="/orders" class="text-sm font-medium text-indigo-600 hover:text-indigo-500">View all</NuxtLink>
      </div>

      <p v-if="loading" class="px-5 py-10 text-center text-sm text-slate-500">Loading orders…</p>
      <p v-else-if="recentOrders.length === 0" class="px-5 py-10 text-center text-sm text-slate-500">
        No orders yet.
        <NuxtLink to="/orders/create" class="font-medium text-indigo-600 hover:text-indigo-500">Create the first one</NuxtLink>
      </p>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200 text-sm">
          <thead class="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th class="px-5 py-3">Invoice</th>
              <th class="px-5 py-3">Customer</th>
              <th class="px-5 py-3">Date</th>
              <th class="px-5 py-3 text-right">Total</th>
              <th class="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="order in recentOrders" :key="order.id" class="hover:bg-slate-50">
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
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
