import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "~": fileURLToPath(new URL("./", import.meta.url)),
      // Only navigateTo is needed from Nuxt; tests replace it with a spy
      "#app": fileURLToPath(new URL("./tests/mocks/nuxt-app.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
