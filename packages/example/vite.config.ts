import { defineConfig } from "vite";
import { preact } from "@preact/preset-vite";
import { blitz, blitzMdx } from "@biliblitz/blitz/vite";

export default defineConfig({
  plugins: [blitz(), preact(), blitzMdx()],
  optimizeDeps: {
    // exclude: ["@biliblitz/blitz"],
  },
});
