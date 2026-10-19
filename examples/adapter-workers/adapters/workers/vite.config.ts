import { workersAdapter } from "@biliblitz/adapter-workers";
import { defineConfig, mergeConfig } from "vite";
import baseConfig from "../../vite.config.ts";

export default mergeConfig(
  baseConfig,
  defineConfig({
    build: { ssr: true },
    plugins: [workersAdapter()],
  }),
);
