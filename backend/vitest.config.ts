import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    env: { NODE_ENV: "test" },
    globalSetup: ["tests/global-setup.ts"],
    // Tests share one database, so run files one at a time
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
});
