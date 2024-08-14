import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { blitz } from "@biliblitz/vite";
import { markdown } from "@biliblitz/vite-plugin-markdown";
import unheadAddon from "@unhead/addons/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    markdown(),
    vue({ include: [/\.vue$/, /\.md$/] }),
    blitz(),
    unheadAddon(),
    tsconfigPaths(),
  ],
});
