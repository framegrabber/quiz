import { defineConfig } from "vitest/config";
import preact from "@preact/preset-vite";

export default defineConfig({
  base: "/quiz/",
  plugins: [preact()],
  // Dedicated port: 5173 is often taken by other local Vite projects.
  server: { host: true, port: 5180, strictPort: true },
  preview: { host: true, port: 5181, strictPort: true },
  test: {
    environment: "happy-dom",
    passWithNoTests: true,
  },
});
