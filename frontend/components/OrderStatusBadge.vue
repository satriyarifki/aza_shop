<script setup lang="ts">
import type { OrderStatus } from "~/types/order";

defineProps<{ status: OrderStatus }>();

const statusStyles: Record<OrderStatus, { label: string; classes: string }> = {
  PENDING: { label: "Pending", classes: "bg-amber-50 text-amber-700 ring-amber-600/20" },
  PAID: { label: "Paid", classes: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
  CANCELLED: { label: "Cancelled", classes: "bg-slate-100 text-slate-600 ring-slate-500/20" },
};
</script>

<template>
  <span
    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset"
    :class="statusStyles[status].classes"
  >
    {{ statusStyles[status].label }}
  </span>
</template>
