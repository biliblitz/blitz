import type { Plugin, ResolvedConfig } from "vite";
import { manifestClient, manifestServer, resolve } from "./vmod.ts";
import { getRequestListener } from "@hono/node-server";
import {
  type Project,
  type ProjectStructure,
  resolveProject,
  scanProjectStructure,
} from "./scanner.ts";
import {
  removeClientServerExports,
  toClientManifestCode,
  toServerManifestCode,
} from "./manifest.ts";
import { loadClientGraph, loadDevGraph } from "./graph.ts";
import type { Hono } from "hono";
import { isVue } from "./utils/ext.ts";

export function blitz(): Plugin<{ env: any }> {
  const vmods = [manifestClient, manifestServer];
  let isDev = false;

  let structure: ProjectStructure | null = null;
  let project: Project | null = null;
  const getStructure = async () => {
    return (structure =
      structure || (await scanProjectStructure("./src/routes")));
  };
  const getProject = async () => {
    return (project = project || (await resolveProject(await getStructure())));
  };

  let resolvedConfig: ResolvedConfig;
  let api: { env: any } = { env: null };

  return {
    name: "blitz",
    api,

    resolveId(id) {
      switch (id) {
        case manifestClient:
          return resolve(manifestClient);
        case manifestServer:
          return resolve(manifestServer);
      }
    },

    async load(id) {
      switch (id) {
        case resolve(manifestClient): {
          const structure = await getStructure();
          const graph = isDev ? await loadDevGraph() : await loadClientGraph();
          const project = await getProject();
          return toClientManifestCode(
            structure,
            project,
            graph,
            resolvedConfig.base,
          );
        }

        case resolve(manifestServer): {
          const structure = await getStructure();
          const graph = isDev ? await loadDevGraph() : await loadClientGraph();
          const project = await getProject();
          return toServerManifestCode(
            structure,
            project,
            graph,
            resolvedConfig.base,
          );
        }
      }

      return null;
    },

    async transform(code, id, options) {
      // remove action/loader in browser
      if (!options?.ssr) {
        const structure = await getStructure();
        const project = await getProject();

        const index = structure.componentPaths.indexOf(id);
        if (index > -1 && !isVue(id)) {
          console.log("I am gonna remove something...", code, id);
          return await removeClientServerExports(code, project.raw[index]);
        }
      }

      return null;
    },

    async config(config, env) {
      // build client
      if (env.command === "build" && !config.build?.ssr) {
        return {
          build: {
            outDir: "dist/client",
            rollupOptions: {
              input: ["./src/entry.client.tsx"],
              output: {
                entryFileNames: "build/p-[hash].js",
                chunkFileNames: "build/p-[hash].js",
                assetFileNames: "build/assets/[hash].[ext]",
              },
            },
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
              input: ["./src/entry.dev.tsx"],
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
      structure = null;
      project = null;
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
