import type { Plugin, ResolvedConfig } from "vite";
import { relative } from "node:path";
import {
  manifestAssets,
  manifestClient,
  manifestServer,
  resolve,
} from "./vmod.ts";
import { getRequestListener } from "@hono/node-server";
import {
  type Project,
  type ProjectStructure,
  resolveProject,
  scanProjectStructure,
} from "./scanner.ts";
import {
  removeClientServerExports,
  toAssetsManifestCode,
  toClientManifestCode,
  toServerManifestCode,
} from "./manifest.ts";
import { loadClientGraph, loadDevGraph } from "./graph.ts";
import type { Hono } from "hono";

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

  const getEntries = (structure: ProjectStructure) => {
    const cwd = process.cwd();
    const entry = "src/entry.client.tsx";
    const components = structure.componentPaths.map((path) =>
      relative(cwd, path),
    );
    return { entry, components };
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
        case manifestAssets:
          return resolve(manifestAssets);
      }
    },

    async load(id) {
      switch (id) {
        case resolve(manifestClient): {
          const structure = await getStructure();
          return toClientManifestCode(structure);
        }

        case resolve(manifestServer): {
          const structure = await getStructure();
          const { entry, components } = getEntries(structure);
          const graph = isDev
            ? await loadDevGraph(entry, components)
            : await loadClientGraph(entry, components);
          const project = await getProject();
          return toServerManifestCode(
            structure,
            project,
            graph,
            resolvedConfig.base,
          );
        }

        case resolve(manifestAssets): {
          const structure = await getStructure();
          const { entry, components } = getEntries(structure);
          const graph = isDev
            ? await loadDevGraph(entry, components)
            : await loadClientGraph(entry, components);
          return toAssetsManifestCode(graph, resolvedConfig.base);
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
        if (index > -1) {
          return await removeClientServerExports(code, project.raw[index]);
        }
      }

      return null;
    },

    async config(config, env) {
      // build client
      if (env.command === "build" && !config.build?.ssr) {
        const structure = await getStructure();
        const entries = getEntries(structure);

        return {
          build: {
            outDir: "dist/client",
            rollupOptions: {
              input: [entries.entry, ...entries.components],
              output: {
                entryFileNames: "build/p-[hash].js",
                chunkFileNames: "build/p-[hash].js",
                assetFileNames: "build/assets/[hash].[ext]",
              },
              preserveEntrySignatures: "allow-extension",
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
