/// <reference types="vitest" />
import { defineConfig } from "vite";

export default defineConfig({
  test: {
    printConsoleTrace: false,
    testTimeout: 10_000,
  },
});
