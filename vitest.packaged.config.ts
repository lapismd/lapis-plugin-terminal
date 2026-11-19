import { mergeConfig, defineConfig } from "vitest/config";
import browser from "./vitest.browser.config";

export default mergeConfig(
  browser,
  defineConfig({
    test: { include: ["tests/packaged/**/*.test.ts"] },
  }),
);
