import { staticAdapter } from "@biliblitz/vite-plugin-static";
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
