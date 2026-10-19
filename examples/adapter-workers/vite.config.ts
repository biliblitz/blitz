import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { blitz } from "@biliblitz/vite";
import unheadAddon from "@unhead/addons/vite";
import { workersDev } from "@biliblitz/adapter-workers";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [vue(), blitz(), unheadAddon(), workersDev()],
});
