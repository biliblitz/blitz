import { staticAdapter } from "@biliblitz/vite/adapters/static";
import { defineConfig, mergeConfig } from "vite";
import baseConfig from "../../vite.config.ts";

export default mergeConfig(
  baseConfig,
  defineConfig({
    base: "/base/",
    plugins: [
      staticAdapter({
        origin: "https://example.com",
        sitemap: true,
      }),
    ],
  }),
);
