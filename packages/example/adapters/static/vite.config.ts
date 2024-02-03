import { staticAdapter } from "@biliblitz/blitz/adapters/static";
import { defineConfig, mergeConfig } from "vite";
import baseConfig from "../../vite.config.ts";

export default mergeConfig(
  baseConfig,
  defineConfig({
    plugins: [
      staticAdapter({
        origin: "https://yoursite.blitz.com",
      }),
    ],
  }),
);
