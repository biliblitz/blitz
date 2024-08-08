import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { blitz } from "@biliblitz/vite";
import unheadAddon from "@unhead/addons/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [blitz(), vue(), unheadAddon(), tsconfigPaths()],
});
