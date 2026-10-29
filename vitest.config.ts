import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/engine/**", "src/schemas/**"],
      thresholds: { lines: 90, branches: 85 },
    },
  },
  resolve: {
    alias: { "@": resolve(__dirname, "./src") },
  },
});
