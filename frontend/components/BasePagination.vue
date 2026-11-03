<script setup lang="ts">
import type { Pagination } from "~/types/api";

const props = defineProps<{ pagination: Pagination }>();
const emit = defineEmits<{ change: [page: number] }>();

const firstItem = computed(() => (props.pagination.page - 1) * props.pagination.limit + 1);
const lastItem = computed(() => Math.min(props.pagination.page * props.pagination.limit, props.pagination.total));
const hasPrevious = computed(() => props.pagination.page > 1);
const hasNext = computed(() => props.pagination.page < props.pagination.total_pages);
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-3 text-sm text-slate-600">
    <p v-if="pagination.total > 0">
      Showing <span class="font-medium text-slate-900">{{ firstItem }}</span>–<span class="font-medium text-slate-900">{{ lastItem }}</span>
      of <span class="font-medium text-slate-900">{{ pagination.total }}</span>
    </p>
    <p v-else>No results</p>

    <div class="flex items-center gap-2">
      <BaseButton variant="secondary" :disabled="!hasPrevious" @click="emit('change', pagination.page - 1)">
        Previous
      </BaseButton>
      <span class="px-1 text-slate-500">Page {{ pagination.page }} of {{ Math.max(pagination.total_pages, 1) }}</span>
      <BaseButton variant="secondary" :disabled="!hasNext" @click="emit('change', pagination.page + 1)">Next</BaseButton>
    </div>
  </div>
</template>
