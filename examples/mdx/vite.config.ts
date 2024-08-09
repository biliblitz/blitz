import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { blitz } from "@biliblitz/vite";
import { blitzMdx } from "@biliblitz/vite-plugin-mdx";
import unheadAddon from "@unhead/addons/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [vue(), blitzMdx(), blitz(), unheadAddon(), tsconfigPaths()],
});
