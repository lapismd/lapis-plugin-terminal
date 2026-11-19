import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";

export default defineConfig({
  test: {
    include: ["tests/browser/**/*.test.ts"],
    testTimeout: 20_000,
    browser: {
      enabled: true,
      headless: true,
      screenshotDirectory: ".local/browser-screenshots",
      provider: playwright({ contextOptions: { deviceScaleFactor: 2 } }),
      instances: [
        { browser: "chromium", viewport: { width: 1000, height: 700 } },
      ],
    },
  },
});
