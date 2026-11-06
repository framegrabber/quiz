import { defineConfig } from "vitest/config";
import preact from "@preact/preset-vite";

export default defineConfig({
  base: "/quiz/",
  plugins: [preact()],
  server: { host: true },
  test: {
    environment: "happy-dom",
    passWithNoTests: true,
  },
});
