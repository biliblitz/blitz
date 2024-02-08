import { defineConfig } from "vite";
import { preact } from "@preact/preset-vite";
import { blitz, blitzMdx } from "@biliblitz/vite";

export default defineConfig({
  plugins: [blitz(), preact(), blitzMdx({ jsxImportSource: "preact" })],
});
