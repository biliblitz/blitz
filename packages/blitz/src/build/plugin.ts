import type { Plugin } from "vite";
import path from "node:path";
import { resolve, manifestClient, manifestServer } from "./vmod.ts";
import { getRequestListener } from "@hono/node-server";
import { Project, resolveProject, scanProjectStructure } from "./scanner.ts";
import {
  toClientComponentCode,
  toClientManifestCode,
  toServerManifestCode,
} from "./manifest.ts";
import { relative } from "node:path";
import { loadClientGraph, loadDevGraph } from "./graph.ts";

export async function blitzCity(): Promise<Plugin> {
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
    const components = project.structure.componentPaths
      .map((path) => relative(cwd, path))
      .map((path) => `${path}?no-blitz`);
    return { entry, components };
  }

  return {
    name: "blitz-city",

    resolveId(id) {
      switch (id) {
        case manifestClient:
          return resolve(manifestClient);
        case manifestServer:
          return resolve(manifestServer);
      }

      if (id.endsWith("?no-blitz")) {
        return path.resolve(id.slice(0, -9)) + "?no-blitz";
      }
    },

    async load(id, options) {
      switch (id) {
        case resolve(manifestClient):
          return toClientManifestCode(await getProject());

        case resolve(manifestServer):
          const project = await getProject();
          const { entry, components } = getEntries(project);
          const graph = isDev
            ? await loadDevGraph(entry, components)
            : await loadClientGraph(entry, components);
          return toServerManifestCode(project, graph);
      }

      // replace action/loader in browser
      if (!options?.ssr) {
        const project = await getProject();

        const index = project.structure.componentPaths.indexOf(id);
        if (index > -1) {
          return toClientComponentCode(
            project.actions[index],
            project.loaders[index],
          );
        }

        if (project.structure.middlewarePaths.includes(id)) {
          console.warn(`Warning: ${id} should not be imported in web`);
          return `export {};`;
        }
      }
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
              // minify: false,
            },
          };
        }

        // build server
        else {
          return {
            build: {
              rollupOptions: {
                external: [/^@biliblitz\/blitz/],
              },
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

    handleHotUpdate() {
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

          const listener = getRequestListener((req) => module.default(req));
          await listener(req, res);
        });
      };
    },
  };
}
