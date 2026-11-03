import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2026-11-01",

  // Internal dashboard behind a login: client-side rendering only
  ssr: false,

  modules: ["@pinia/nuxt"],
  css: ["~/assets/css/main.css"],

  vite: {
    plugins: [tailwindcss()],
  },

  // The backend already uses port 3000
  devServer: {
    port: 3001,
  },

  runtimeConfig: {
    public: {
      // Overridden by NUXT_PUBLIC_API_BASE
      apiBase: "http://localhost:3000/api",
    },
  },

  app: {
    head: {
      title: "Shop Admin",
      htmlAttrs: { lang: "id" },
    },
  },

  typescript: {
    strict: true,
  },

  devtools: { enabled: false },
});
