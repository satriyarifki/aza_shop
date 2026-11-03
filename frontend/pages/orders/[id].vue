<script setup lang="ts">
import type { OrderDetail } from "~/types/order";

definePageMeta({ middleware: "auth" });

type StatusAction = "pay" | "cancel";

const route = useRoute();
const { getOrder, payOrder, cancelOrder } = useOrders();

const orderId = Number(route.params.id);

const order = ref<OrderDetail | null>(null);
const loading = ref(true);
const loadError = ref("");
const actionError = ref("");
const successMessage = ref(route.query.created ? "Order created successfully." : "");

useHead(() => ({ title: `${order.value?.order_number ?? "Order"} · Shop Admin` }));

async function loadOrder() {
  loading.value = true;
  loadError.value = "";

  try {
    const response = await getOrder(orderId);
    order.value = response.data;
  } catch (error) {
    loadError.value = error instanceof ApiError ? error.message : "Could not load the order.";
  } finally {
    loading.value = false;
  }
}

onMounted(loadOrder);

// Only offer actions the backend allows for the current status; the backend still validates them
const canPay = computed(() => order.value?.status === "PENDING");
const canCancel = computed(() => order.value?.status === "PENDING" || order.value?.status === "PAID");

const pendingAction = ref<StatusAction | null>(null);
const submittingAction = ref(false);

const confirmText = computed(() => {
  if (pendingAction.value === "pay") {
    return {
      title: "Mark this order as paid?",
      description: "The order status will change to Paid.",
      button: "Mark as paid",
    };
  }
  return {
    title: "Cancel this order?",
    description: "The order will be cancelled and its items returned to stock. This cannot be undone.",
    button: "Cancel order",
  };
});

async function confirmAction() {
  if (!pendingAction.value) {
    return;
  }

  submittingAction.value = true;
  actionError.value = "";
  successMessage.value = "";

  try {
    const response = pendingAction.value === "pay" ? await payOrder(orderId) : await cancelOrder(orderId);
    order.value = response.data;
    successMessage.value = response.message;
  } catch (error) {
    actionError.value = error instanceof ApiError ? error.message : "Could not update the order.";
    // The status may have been changed elsewhere; show the latest state
    await loadOrder();
  } finally {
    submittingAction.value = false;
    pendingAction.value = null;
  }
}
</script>

<template>
  <div class="space-y-6">
    <NuxtLink to="/orders" class="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700">
      <span aria-hidden="true">←</span> Back to orders
    </NuxtLink>

    <p v-if="loading && !order" class="py-12 text-center text-sm text-slate-500">Loading order…</p>

    <BaseAlert v-else-if="loadError && !order">
      {{ loadError }}
      <button type="button" class="ml-2 font-medium underline" @click="loadOrder">Try again</button>
    </BaseAlert>

    <template v-else-if="order">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div class="flex flex-wrap items-center gap-3">
            <h1 class="text-2xl font-semibold text-slate-900">{{ order.order_number }}</h1>
            <OrderStatusBadge :status="order.status" />
          </div>
          <p class="mt-1 text-sm text-slate-500">
            Created {{ formatDateTime(order.created_at) }} by {{ order.created_by.name }}
          </p>
        </div>

        <div v-if="canPay || canCancel" class="flex gap-3">
          <BaseButton v-if="canCancel" variant="secondary" @click="pendingAction = 'cancel'">Cancel order</BaseButton>
          <BaseButton v-if="canPay" @click="pendingAction = 'pay'">Mark as paid</BaseButton>
        </div>
      </div>

      <BaseAlert v-if="successMessage" variant="success">{{ successMessage }}</BaseAlert>
      <BaseAlert v-if="actionError">{{ actionError }}</BaseAlert>

      <div class="grid gap-6 lg:grid-cols-3">
        <section class="min-w-0 rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
          <h2 class="border-b border-slate-200 px-5 py-4 text-base font-semibold text-slate-900">Items</h2>
          <BaseTable
            :columns="[
              { label: 'Product' },
              { label: 'Unit price', align: 'right' },
              { label: 'Qty', align: 'right' },
              { label: 'Subtotal', align: 'right' },
            ]"
          >
            <tr v-for="item in order.items" :key="item.id">
              <td class="px-5 py-3">
                <p class="font-medium text-slate-900">{{ item.product_name }}</p>
                <p class="font-mono text-xs text-slate-500">{{ item.product_code }}</p>
              </td>
              <td class="whitespace-nowrap px-5 py-3 text-right text-slate-700">{{ formatRupiah(item.unit_price) }}</td>
              <td class="whitespace-nowrap px-5 py-3 text-right text-slate-700">{{ item.quantity }}</td>
              <td class="whitespace-nowrap px-5 py-3 text-right font-medium text-slate-900">{{ formatRupiah(item.subtotal) }}</td>
            </tr>
          </BaseTable>

          <dl class="space-y-2 border-t border-slate-200 px-5 py-4 text-sm">
            <div class="flex justify-between text-slate-600">
              <dt>Subtotal</dt>
              <dd>{{ formatRupiah(order.subtotal) }}</dd>
            </div>
            <div class="flex justify-between text-slate-600">
              <dt>Discount</dt>
              <dd class="text-emerald-700">− {{ formatRupiah(order.discount_amount) }}</dd>
            </div>
            <div class="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold text-slate-900">
              <dt>Grand total</dt>
              <dd>{{ formatRupiah(order.grand_total) }}</dd>
            </div>
          </dl>
          <p class="px-5 pb-4 text-xs text-slate-500">Unit prices are the prices at the time the order was placed.</p>
        </section>

        <section class="h-fit rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 class="text-base font-semibold text-slate-900">Customer</h2>
          <dl class="mt-4 space-y-3 text-sm">
            <div>
              <dt class="text-slate-500">Name</dt>
              <dd class="font-medium text-slate-900">{{ order.customer.name }}</dd>
            </div>
            <div>
              <dt class="text-slate-500">Email</dt>
              <dd class="text-slate-900">{{ order.customer.email ?? "—" }}</dd>
            </div>
            <div>
              <dt class="text-slate-500">Phone</dt>
              <dd class="text-slate-900">{{ order.customer.phone ?? "—" }}</dd>
            </div>
            <div>
              <dt class="text-slate-500">Address</dt>
              <dd class="text-slate-900">{{ order.customer.address ?? "—" }}</dd>
            </div>
          </dl>
        </section>
      </div>
    </template>

    <BaseModal
      :open="pendingAction !== null"
      :title="confirmText.title"
      :description="confirmText.description"
      @close="pendingAction = null"
    >
      <p class="text-sm text-slate-600">
        Order <span class="font-medium text-slate-900">{{ order?.order_number }}</span> ·
        {{ order ? formatRupiah(order.grand_total) : "" }}
      </p>

      <template #footer>
        <BaseButton variant="secondary" @click="pendingAction = null">Go back</BaseButton>
        <BaseButton
          :variant="pendingAction === 'cancel' ? 'danger' : 'primary'"
          :loading="submittingAction"
          @click="confirmAction"
        >
          {{ confirmText.button }}
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
