import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { blitz } from "@biliblitz/vite";
import { mdit } from "@biliblitz/vite-plugin-mdit";
import unheadAddon from "@unhead/addons/vite";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    mdit(),
    vue({ include: [/\.vue$/, /\.md$/] }),
    blitz(),
    unheadAddon(),
  ],
});
