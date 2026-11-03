<script setup lang="ts">
const model = defineModel<string>({ default: "" });

defineProps<{
  label: string;
  type?: string;
  placeholder?: string;
  error?: string;
  hint?: string;
  autocomplete?: string;
  inputmode?: "text" | "numeric" | "email" | "tel" | "search";
  required?: boolean;
}>();

const inputId = useId();
</script>

<template>
  <div>
    <label :for="inputId" class="mb-1.5 block text-sm font-medium text-slate-700">
      {{ label }}
      <span v-if="required" class="text-rose-500" aria-hidden="true">*</span>
    </label>
    <input
      :id="inputId"
      v-model="model"
      :type="type ?? 'text'"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :inputmode="inputmode"
      :aria-invalid="Boolean(error)"
      :aria-describedby="error || hint ? `${inputId}-message` : undefined"
      class="block w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-2 focus:outline-offset-0"
      :class="error ? 'border-rose-400 focus:outline-rose-500' : 'border-slate-300 focus:outline-indigo-500'"
    />
    <p v-if="error" :id="`${inputId}-message`" class="mt-1.5 text-xs text-rose-600">{{ error }}</p>
    <p v-else-if="hint" :id="`${inputId}-message`" class="mt-1.5 text-xs text-slate-500">{{ hint }}</p>
  </div>
</template>
