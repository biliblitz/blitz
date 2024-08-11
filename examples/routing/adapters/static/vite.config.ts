import { staticAdapter } from "@biliblitz/adapter-static";
import { defineConfig, mergeConfig } from "vite";
import baseConfig from "../../vite.config.ts";

export default mergeConfig(
  baseConfig,
  defineConfig({
    plugins: [
      staticAdapter({
        origin: "https://example.com",
        sitemap: true,
      }),
    ],
  }),
);
