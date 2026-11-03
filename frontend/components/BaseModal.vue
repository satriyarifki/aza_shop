<script setup lang="ts">
const props = defineProps<{
  open: boolean;
  title: string;
  description?: string;
}>();

const emit = defineEmits<{ close: [] }>();

const titleId = useId();

function closeOnEscape(event: KeyboardEvent) {
  if (event.key === "Escape") {
    emit("close");
  }
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      document.addEventListener("keydown", closeOnEscape);
    } else {
      document.removeEventListener("keydown", closeOnEscape);
    }
  },
);

onBeforeUnmount(() => document.removeEventListener("keydown", closeOnEscape));
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div class="absolute inset-0 bg-slate-900/50" aria-hidden="true" @click="emit('close')" />

      <div
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        class="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl"
      >
        <div class="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div>
            <h2 :id="titleId" class="text-base font-semibold text-slate-900">{{ title }}</h2>
            <p v-if="description" class="mt-1 text-sm text-slate-500">{{ description }}</p>
          </div>
          <button
            type="button"
            class="-mr-2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
            @click="emit('close')"
          >
            <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="px-6 py-5">
          <slot />
        </div>

        <div v-if="$slots.footer" class="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>
