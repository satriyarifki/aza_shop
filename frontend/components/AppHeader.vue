<script setup lang="ts">
defineEmits<{ toggleSidebar: [] }>();

const auth = useAuthStore();
</script>

<template>
  <header class="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
    <button
      type="button"
      class="-ml-1 rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
      aria-label="Open navigation"
      @click="$emit('toggleSidebar')"
    >
      <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>

    <div class="ml-auto flex items-center gap-3">
      <div class="hidden text-right sm:block">
        <p class="text-sm font-medium text-slate-900">{{ auth.user?.name ?? "Admin" }}</p>
        <p class="text-xs text-slate-500">{{ auth.user?.email }}</p>
      </div>
      <BaseButton variant="secondary" @click="auth.logout()">Sign out</BaseButton>
    </div>
  </header>
</template>
