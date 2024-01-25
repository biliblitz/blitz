import type { Plugin } from "vite";
import { resolve, manifestId } from "./vmod.ts";
import { getRequestListener } from "@hono/node-server";
import {
  parseAction,
  parseLoader,
  parseMiddleware,
  scanProjectStructure,
} from "./scanner.ts";

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
          const structure = await scanProjectStructure("./app/routes");
          console.log(structure);
          const actions = await Promise.all(
            structure.actionPaths.map(parseAction),
          );
          const loaders = await Promise.all(
            structure.loaderPaths.map(parseLoader),
          );
          const middlewares = await Promise.all(
            structure.middlewarePaths.map(parseMiddleware),
          );
          console.log("actions", actions);
          console.log("loaders", loaders);
          console.log("middlewares", middlewares);
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
                entryFileNames: "assets/e-[hash].js",
                assetFileNames: "assets/a-[hash].[ext]",
                chunkFileNames: "assets/c-[hash].js",
              },
            },
          },
        };
      }

      // build server
      if (env.command === "build" && config.build?.ssr) {
        return {
          build: {
            rollupOptions: {
              external: [/^@biliblitz\/blitz/],
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
