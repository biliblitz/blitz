import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { blitz } from "@biliblitz/vite";
import { mdx } from "@biliblitz/vite-plugin-mdx";
import unheadAddon from "@unhead/addons/vite";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [vue(), mdx(), blitz(), unheadAddon()],
});
