import type { Plugin } from "vite";
import { resolve, manifestId } from "./vmod.ts";
import { getRequestListener } from "@hono/node-server";

export async function blitzCity(): Promise<Plugin> {
  const vmods = [manifestId];

  return {
    name: "blitz-city",

    resolveId(id) {
      switch (id) {
        case manifestId:
          return resolve(manifestId);
      }
    },

    async load(id) {
      switch (id) {
        case resolve(manifestId):
          // TODO: parse app/ folder here
          return `export const x = "manifest";`;
      }
    },

    config(config, env) {
      // build client
      if (env.command === "build" && !config.build?.ssr) {
        return {
          build: {
            rollupOptions: {
              input: ["./app/entry.client.tsx"],
              output: {
                entryFileNames: "assets/[name].js",
              },
            },
          },
        };
      }

      // dev mode
      if (env.command === "serve") {
        return {
          appType: "custom",
        };
      }
    },

    configureServer(vite) {
      return () => {
        vite.middlewares.use(async (req, res) => {
          // invalidate old modules
          for (const vmod of vmods) {
            const node = vite.moduleGraph.getModuleById(resolve(vmod));
            if (node) {
              vite.moduleGraph.invalidateModule(node);
            }
          }

          console.log("middleware", req.url);

          const module = await vite.ssrLoadModule("./app/entry.dev.tsx");

          const listener = getRequestListener((req) => module.default(req));
          await listener(req, res);
        });
      };
    },
  };
}
