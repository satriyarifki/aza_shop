<script setup lang="ts">
import type { TableColumn } from "~/types/ui";

defineProps<{
  columns: TableColumn[];
  loading?: boolean;
  empty?: boolean;
  emptyText?: string;
}>();
</script>

<template>
  <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-slate-200 text-sm">
      <thead class="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
        <tr>
          <th
            v-for="column in columns"
            :key="column.label"
            scope="col"
            class="whitespace-nowrap px-5 py-3"
            :class="column.align === 'right' ? 'text-right' : 'text-left'"
          >
            {{ column.label }}
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        <tr v-if="loading">
          <td :colspan="columns.length" class="px-5 py-12 text-center text-slate-500">Loading…</td>
        </tr>
        <tr v-else-if="empty">
          <td :colspan="columns.length" class="px-5 py-12 text-center text-slate-500">
            {{ emptyText ?? "No data found." }}
          </td>
        </tr>
        <slot v-else />
      </tbody>
    </table>
  </div>
</template>
