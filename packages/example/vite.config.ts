import { defineConfig } from "vite";
import { preact } from "@preact/preset-vite";
import mdx from "@mdx-js/rollup";
import { blitzCity } from "@biliblitz/blitz/vite";

export default defineConfig({
  plugins: [blitzCity(), preact(), mdx({ jsxImportSource: "preact" })],
  optimizeDeps: {
    // exclude: ["@biliblitz/blitz"],
  },
});
