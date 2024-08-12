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
import { cacheAsync, waitAsync } from "./utils.ts";
import { resolve as resolvePath } from "path";
import { hashRef } from "@biliblitz/blitz/utils";

export function blitz(): Plugin<{ fetch?: { env: any; ctx: any } }> {
  const srcRoutes = resolvePath("./src/routes");
  const vmods = [manifestClient, manifestServer];
  let isDev = false;

  const inRoutes = (path: string) => path.startsWith(srcRoutes + "/");

  const structure = cacheAsync(
    waitAsync(async () => {
      // console.log("blitz: scanning structure...");
      return await scanProjectStructure(srcRoutes);
    }),
  );

  let resolvedConfig: ResolvedConfig;
  let api: { fetch?: { env: any; ctx: any } } = {};

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
          const project = await structure.fetch();
          return toClientManifestCode(project, resolvedConfig.base);
        }

        case resolve(manifestServer): {
          const project = await structure.fetch();
          const graph = isDev ? await loadDevGraph() : await loadClientGraph();
          return toServerManifestCode(project, graph, resolvedConfig.base);
        }
      }
    },

    async transform(code, id, options) {
      // remove action/loader in browser
      const [path, params] = id.split("?");
      if (!options?.ssr && inRoutes(path) && isLayer(path)) {
        if (!params?.includes("type=style")) {
          // console.log("blitz:shaking", id);
          return await removeClientServerExports(code, hashRef(path));
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
              input: ["./src/entry.client.ts"],
              output: {
                entryFileNames: "build/p-[hash].js",
                chunkFileNames: "build/p-[hash].js",
                assetFileNames: "build/assets/[hash].[ext]",
              },
            },
            modulePreload: true,
            copyPublicDir: false,
          },
          optimizeDeps: {
            include: ["vue", "vue-router", "@unhead/vue", "@biliblitz/blitz"],
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
              input: ["./src/entry.client.ts"],
            },
          },
          optimizeDeps: {
            include: ["vue", "vue-router", "@unhead/vue", "@biliblitz/blitz"],
          },
        };
      }
    },

    configResolved(config) {
      resolvedConfig = config;
    },

    async handleHotUpdate({ file, server }) {
      // console.log(`hot update: ${file}`);

      const project = await structure.fetch();
      const looksLikeLayer = inRoutes(file) && isLayer(file);

      // on new file created
      if (looksLikeLayer) {
        // we don't full-reload full page for speed.
        // if user finds "loader not found", one should manually reload page.
        // server.ws.send({ type: "full-reload" });

        // do a clean flush
        if (!project.componentPaths.includes(file)) {
          structure.fresh();
          for (const vmod of vmods) {
            const module = server.moduleGraph.getModuleById(resolve(vmod));
            if (module) server.moduleGraph.invalidateModule(module);
          }
        }
      }
    },

    configureServer(vite) {
      return () => {
        vite.middlewares.use(async (req, res) => {
          const module = await vite.ssrLoadModule("./src/entry.dev.ts");
          const app = module.default as Hono;

          const listener = getRequestListener((req) =>
            api.fetch
              ? app.fetch(req, api.fetch.env, api.fetch.ctx)
              : app.fetch(req),
          );
          await listener(req, res);
        });
      };
    },
  };
}
