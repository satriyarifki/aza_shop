<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const auth = useAuthStore();
</script>

<template>
  <!-- Temporary landing page until the dashboard layout is built -->
  <main class="flex min-h-screen items-center justify-center bg-slate-50">
    <div class="rounded-xl border border-slate-200 bg-white px-8 py-6 text-center shadow-sm">
      <h1 class="text-lg font-semibold text-slate-900">Shop Admin</h1>
      <p class="mt-1 text-sm text-slate-500">Signed in as {{ auth.user?.email ?? "…" }}</p>
      <BaseButton variant="secondary" class="mt-4" @click="auth.logout()">Sign out</BaseButton>
    </div>
  </main>
</template>
