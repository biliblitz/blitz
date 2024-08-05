import type { Plugin } from "vite";
import { getPlatformProxy } from "wrangler";

export function workersDev(): Plugin {
  return {
    name: "blitz-workers-dev",
    apply: "serve",

    async configResolved(config) {
      const proxy = await getPlatformProxy();
      // console.log("wrangler proxy is working...");
      for (const plugin of config.plugins) {
        if (plugin.name === "blitz" && plugin.api) {
          plugin.api.env = proxy.env;
        }
      }
    },
  };
}

export function workersAdapter(): Plugin {
  return {
    name: "blitz-workers-adapter",
    apply: "build",

    config(_config, env) {
      if (env.command === "build") {
        return {
          build: {
            target: "esnext",
            outDir: "dist/workers",
            rollupOptions: {
              input: "./src/entry.workers.tsx",
              output: {
                entryFileNames: "server.js",
                assetFileNames: "build/assets/[hash].[ext]",
              },
            },
            minify: true,
          },
          ssr: { noExternal: true },
        };
      }
    },
  };
}
