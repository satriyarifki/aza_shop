<script setup lang="ts">
type Variant = "error" | "success" | "info";

withDefaults(defineProps<{ variant?: Variant }>(), { variant: "error" });

const variantClasses: Record<Variant, string> = {
  error: "border-rose-200 bg-rose-50 text-rose-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  info: "border-sky-200 bg-sky-50 text-sky-700",
};
</script>

<template>
  <div
    :role="variant === 'error' ? 'alert' : 'status'"
    class="rounded-lg border px-4 py-3 text-sm"
    :class="variantClasses[variant]"
  >
    <slot />
  </div>
</template>
