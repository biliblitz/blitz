import { defineConfig } from "vite";
import { preact } from "@preact/preset-vite";
import { blitz, blitzMdx } from "@biliblitz/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    blitz(),
    preact(),
    tsconfigPaths(),
    blitzMdx({ jsxImportSource: "preact" }),
  ],
});
