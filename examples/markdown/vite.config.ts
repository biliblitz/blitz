import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { blitz } from "@biliblitz/vite";
import { markdown } from "@biliblitz/vite-plugin-markdown";
import unheadAddon from "@unhead/addons/vite";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    markdown(),
    vue({ include: [/\.vue$/, /\.md$/] }),
    blitz(),
    unheadAddon(),
  ],
});
