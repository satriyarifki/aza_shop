<script setup lang="ts">
defineEmits<{ navigate: [] }>();

// Outline icons (24x24 stroke paths) kept inline to avoid an icon library dependency
const navigationItems = [
  { label: "Dashboard", to: "/", icon: "M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10" },
  {
    label: "Orders",
    to: "/orders",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  },
  { label: "Products", to: "/products", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
  {
    label: "Customers",
    to: "/customers",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  },
];

const route = useRoute();

function isActive(path: string) {
  return path === "/" ? route.path === "/" : route.path.startsWith(path);
}
</script>

<template>
  <nav class="flex h-full flex-col gap-6 bg-slate-900 px-4 py-6 text-slate-300">
    <NuxtLink to="/" class="flex items-center gap-3 px-2" @click="$emit('navigate')">
      <span class="flex size-9 items-center justify-center rounded-lg bg-indigo-500 font-bold text-white">S</span>
      <span class="text-base font-semibold text-white">Shop Admin</span>
    </NuxtLink>

    <NuxtLink
      to="/orders/create"
      class="flex items-center justify-center gap-2 rounded-lg bg-indigo-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-400"
      @click="$emit('navigate')"
    >
      <span aria-hidden="true" class="text-lg leading-none">+</span>
      New order
    </NuxtLink>

    <ul class="space-y-1">
      <li v-for="item in navigationItems" :key="item.to">
        <NuxtLink
          :to="item.to"
          class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
          :class="isActive(item.to) ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/60 hover:text-white'"
          :aria-current="isActive(item.to) ? 'page' : undefined"
          @click="$emit('navigate')"
        >
          <svg class="size-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" :d="item.icon" />
          </svg>
          {{ item.label }}
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>
