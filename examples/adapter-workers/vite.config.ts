import { defineConfig } from "vite";
import { preact } from "@preact/preset-vite";
import { blitz } from "@biliblitz/vite";
import { workersDev } from "@biliblitz/adapter-workers";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [blitz(), preact(), tsconfigPaths(), workersDev()],
});
