import type { Plugin, ResolvedConfig } from "vite";
import type { PluginContext } from "rollup";
import { manifestClient, manifestServer, resolve } from "./vmod.ts";
import { getRequestListener } from "@hono/node-server";
import { resolveProject, scanProjectStructure } from "./scanner.ts";
import {
  removeClientServerExports,
  toClientManifestCode,
  toServerManifestCode,
} from "./manifest.ts";
import { loadClientGraph, loadDevGraph } from "./graph.ts";
import type { Hono } from "hono";
import { cacheAsync, waitAsync } from "./utils/algorithms.ts";

export function blitz(): Plugin<{ env: any }> {
  const vmods = [manifestClient, manifestServer];
  let isDev = false;

  const proj = cacheAsync(
    waitAsync(async (ctx: PluginContext) => {
      const structure = await scanProjectStructure("./src/routes");
      return await resolveProject(structure, ctx);
    }),
  );

  let resolvedConfig: ResolvedConfig;
  let api: { env: any } = { env: null };

  return {
    name: "blitz",
    api,

    async resolveId(source, importer, options) {
      // console.log("resolving", source, importer, options);
      switch (source) {
        case manifestClient:
          // console.log("triggering proj");
          await proj.value(this);
          return resolve(manifestClient);
        case manifestServer:
          // console.log("triggering proj");
          await proj.value(this);
          return resolve(manifestServer);
      }
    },

    async load(id) {
      // console.log("loading", id);
      switch (id) {
        case resolve(manifestClient): {
          // console.log("triggering proj");
          const project = await proj.value(this);
          return toClientManifestCode(project, resolvedConfig.base);
        }

        case resolve(manifestServer): {
          // console.log("triggering proj");
          const project = await proj.value(this);
          const graph = isDev ? await loadDevGraph() : await loadClientGraph();
          return toServerManifestCode(project, graph, resolvedConfig.base);
        }
      }
    },

    async transform(code, id, options) {
      // console.log("transform", "/* code */", id);
      // remove action/loader in browser
      if (!options?.ssr && id.endsWith("index.vue")) {
        // console.log("I am gonna remove something...", code, id);
        return await removeClientServerExports(code, {
          action: [],
          loader: [],
          middleware: false,
        });
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
