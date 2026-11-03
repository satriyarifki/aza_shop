<script setup lang="ts">
import type { SelectOption } from "~/types/ui";

const model = defineModel<string | number | null>({ default: null });

defineProps<{
  label: string;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  hideLabel?: boolean;
}>();

const selectId = useId();
</script>

<template>
  <div>
    <label :for="selectId" class="mb-1.5 block text-sm font-medium text-slate-700" :class="{ 'sr-only': hideLabel }">
      {{ label }}
    </label>
    <select
      :id="selectId"
      v-model="model"
      :aria-invalid="Boolean(error)"
      class="block w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 focus:outline-2 focus:outline-offset-0"
      :class="error ? 'border-rose-400 focus:outline-rose-500' : 'border-slate-300 focus:outline-indigo-500'"
    >
      <option v-if="placeholder" :value="null" disabled>{{ placeholder }}</option>
      <option v-for="option in options" :key="option.value" :value="option.value" :disabled="option.disabled">
        {{ option.label }}
      </option>
    </select>
    <p v-if="error" class="mt-1.5 text-xs text-rose-600">{{ error }}</p>
  </div>
</template>
