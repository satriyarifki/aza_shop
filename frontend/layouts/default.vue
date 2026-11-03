<script setup lang="ts">
const sidebarOpen = ref(false);

// Close the mobile drawer whenever the page changes
const route = useRoute();
watch(() => route.fullPath, () => {
  sidebarOpen.value = false;
});
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <!-- Desktop sidebar -->
    <aside class="fixed inset-y-0 left-0 hidden w-64 lg:block">
      <AppSidebar />
    </aside>

    <!-- Mobile drawer -->
    <div v-if="sidebarOpen" class="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
      <div class="absolute inset-0 bg-slate-900/50" @click="sidebarOpen = false" />
      <aside class="relative h-full w-64 max-w-[80%]">
        <AppSidebar @navigate="sidebarOpen = false" />
      </aside>
    </div>

    <div class="lg:pl-64">
      <AppHeader @toggle-sidebar="sidebarOpen = true" />
      <main class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <slot />
      </main>
    </div>
  </div>
</template>
