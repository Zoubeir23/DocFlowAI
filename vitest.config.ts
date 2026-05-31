import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: [
        "lib/utils.ts",
        "lib/notifications.ts",
        "lib/sms/**/*.ts",
        "lib/email/templates/**/*.ts",
      ],
      exclude: [
        "**/*.d.ts",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },
  },
});
