/// <reference types="vitest" />
import { defineConfig } from "vite";

export default defineConfig({
  test: {
    printConsoleTrace: false,
    onConsoleLog(log: string, type: "stdout" | "stderr"): boolean | void {
      return true;
    },
    testTimeout: 3_000,
  },
});
