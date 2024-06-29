import type { Plugin } from "vite";
import { relative } from "node:path";
import {
  resolve,
  manifestAssets,
  manifestClient,
  manifestServer,
} from "./vmod.ts";
import { getRequestListener } from "@hono/node-server";
import { Project, resolveProject, scanProjectStructure } from "./scanner.ts";
import {
  toAssetsManifestCode,
  toClientManifestCode,
  toServerManifestCode,
  removeClientServerExports,
} from "./manifest.ts";
import { loadClientGraph, loadDevGraph } from "./graph.ts";
import { Hono } from "hono";
import treeshakeJsxEvents from "@swwind/treeshake-jsx-events";

export async function blitz(): Promise<Plugin> {
  const vmods = [manifestClient, manifestServer];
  let isDev = false;

  let project: Project | null = null;
  async function getProject() {
    if (!project) {
      const structure = await scanProjectStructure("./app/routes");
      project = await resolveProject(structure);
    }
    return project;
  }
  function getEntries(project: Project) {
    const cwd = process.cwd();
    const entry = "app/entry.client.tsx";
    const components = project.structure.componentPaths.map((path) =>
      relative(cwd, path),
    );
    return { entry, components };
  }

  let base = "/";

  return {
    name: "blitz",

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
        case resolve(manifestClient):
          return toClientManifestCode(await getProject());

        case resolve(manifestServer): {
          const project = await getProject();
          const { entry, components } = getEntries(project);
          const graph = isDev
            ? await loadDevGraph(entry, components)
            : await loadClientGraph(entry, components);
          return toServerManifestCode(project, graph, base);
        }

        case resolve(manifestAssets): {
          const project = await getProject();
          const { entry, components } = getEntries(project);
          const graph = isDev
            ? await loadDevGraph(entry, components)
            : await loadClientGraph(entry, components);
          return toAssetsManifestCode(graph, base);
        }
      }
    },

    async transform(code, id, options) {
      // replace action/loader in browser
      if (!options?.ssr) {
        const project = await getProject();

        const index = project.structure.componentPaths.indexOf(id);
        if (index > -1) {
          return removeClientServerExports(
            code,
            project.actions[index],
            project.loaders[index],
            project.metas[index],
          );
        }
      }

      // treeshake onClick events from SSR build
      if (options?.ssr) {
        if (/\.(?:jsx|tsx)$/.test(id)) {
          return treeshakeJsxEvents(code);
        }
      }

      return null;
    },

    async config(config, env) {
      if (env.command === "build") {
        // build client
        if (!config.build?.ssr) {
          const project = await getProject();
          const entries = getEntries(project);

          return {
            build: {
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

        // build server
        else {
          return {
            build: {
              rollupOptions: {
                external: [/^@biliblitz\//],
                output: {
                  assetFileNames: "build/assets/[hash].[ext]",
                },
              },
              copyPublicDir: false,
              cssMinify: true,
            },
          };
        }
      }

      // dev mode
      if (env.command === "serve") {
        isDev = true;
        return {
          appType: "custom",
        };
      }
    },

    configResolved(config) {
      base = config.base;
    },

    handleHotUpdate(ctx) {
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

          const module = await vite.ssrLoadModule("./app/entry.dev.tsx");
          const app = module.default as Hono;

          const listener = getRequestListener((req) => app.fetch(req));
          await listener(req, res);
        });
      };
    },
  };
}
