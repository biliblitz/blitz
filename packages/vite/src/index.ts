import type { Plugin, ResolvedConfig } from "vite";
import { manifestClient, manifestServer, resolve } from "./vmod.ts";
import { getRequestListener } from "@hono/node-server";
import { isLayer, scanProjectStructure } from "./scanner.ts";
import {
  removeClientServerExports,
  toClientManifestCode,
  toServerManifestCode,
} from "./manifest.ts";
import { loadClientGraph, loadDevGraph } from "./graph.ts";
import type { Hono } from "hono";
import { cacheAsync, waitAsync } from "./utils/algorithms.ts";
import { resolve as resolvePath } from "path";

export function blitz(): Plugin<{ env: any }> {
  const srcRoutes = resolvePath("./src/routes");
  // const vmods = [manifestClient, manifestServer];
  let isDev = false;

  const structure = cacheAsync(
    waitAsync(async () => {
      // console.log("blitz: scanning structure...");
      const structure = await scanProjectStructure(srcRoutes);
      // console.log("blitz: scanning finished...");
      return structure;
    }),
  );

  let resolvedConfig: ResolvedConfig;
  let api: { env: any } = { env: null };

  return {
    name: "blitz",
    api,

    async resolveId(source) {
      switch (source) {
        case manifestClient:
          return resolve(manifestClient);
        case manifestServer:
          return resolve(manifestServer);
      }
    },

    async load(id) {
      switch (id) {
        case resolve(manifestClient): {
          const project = await structure.value();
          return toClientManifestCode(project, resolvedConfig.base);
        }

        case resolve(manifestServer): {
          const project = await structure.value();
          const graph = isDev ? await loadDevGraph() : await loadClientGraph();
          return toServerManifestCode(project, graph, resolvedConfig.base);
        }
      }
    },

    async transform(code, id, options) {
      // remove action/loader in browser
      const [path, params] = id.split("?");
      if (!options?.ssr && path.startsWith(srcRoutes + "/") && isLayer(path)) {
        if (!params?.includes("type=style")) {
          // console.log("blitz:shaking", id);
          return await removeClientServerExports(code);
        }
      }
    },

    async config(config, env) {
      // build client
      if (env.command === "build" && !config.build?.ssr) {
        return {
          build: {
            target: "esnext",
            outDir: "dist/client",
            rollupOptions: {
              input: ["./src/entry.client.tsx"],
              output: {
                entryFileNames: "build/p-[hash].js",
                chunkFileNames: "build/p-[hash].js",
                assetFileNames: "build/assets/[hash].[ext]",
              },
            },
            modulePreload: true,
            copyPublicDir: false,
          },
        };
      }

      // dev mode
      if (env.command === "serve") {
        isDev = true;
        return {
          appType: "custom",
          build: {
            rollupOptions: {
              input: [manifestClient],
            },
          },
        };
      }
    },

    configResolved(config) {
      resolvedConfig = config;
    },

    handleHotUpdate(ctx) {
      // TODO
      // structure = null;
      // project = null;

      console.log(`hot update: ${ctx.file}`);
      // if (structure?.componentPaths.includes(ctx.file)) {
      //   console.log("seems contains");
      // } else {
      //   console.log(structure?.componentPaths);
      // }
    },

    configureServer(vite) {
      return () => {
        vite.middlewares.use(async (req, res) => {
          // // invalidate old modules
          // for (const vmod of vmods) {
          //   const node = vite.moduleGraph.getModuleById(resolve(vmod));
          //   if (node) {
          //     vite.moduleGraph.invalidateModule(node);
          //   }
          // }

          const module = await vite.ssrLoadModule("./src/entry.dev.tsx");
          const app = module.default as Hono;

          const listener = getRequestListener((req) =>
            api.env ? app.fetch(req, api.env) : app.fetch(req),
          );
          await listener(req, res);
        });
      };
    },
  };
}
