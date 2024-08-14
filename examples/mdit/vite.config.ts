import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { blitz } from "@biliblitz/vite";
import { mdit } from "@biliblitz/vite-plugin-mdit";
import unheadAddon from "@unhead/addons/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    mdit(),
    vue({ include: [/\.vue$/, /\.md$/] }),
    blitz(),
    unheadAddon(),
    tsconfigPaths(),
  ],
});
