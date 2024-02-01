import type { Plugin } from "vite";
import { resolve, manifestClient, manifestServer } from "./vmod.ts";
import { getRequestListener } from "@hono/node-server";
import { Project, resolveProject, scanProjectStructure } from "./scanner.ts";
import {
  toClientActionCode,
  toClientLoaderCode,
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
      project = await resolveProject(
        await scanProjectStructure("./app/routes"),
      );
    }
    return project;
  }
  async function getEntries() {
    const project = await getProject();
    const cwd = process.cwd();
    const entry = "app/entry.client.tsx";
    const components = project.structure.componentPaths.map((path) =>
      relative(cwd, path),
    );
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
    },

    async load(id, options) {
      switch (id) {
        case resolve(manifestClient):
          return toClientManifestCode(await getProject());

        case resolve(manifestServer):
          const project = await getProject();
          const { entry, components } = await getEntries();
          const graph = isDev
            ? await loadDevGraph(entry, components)
            : await loadClientGraph(entry, components);
          return toServerManifestCode(project, graph);
      }

      // replace action/loader in browser
      if (!options?.ssr) {
        const project = await getProject();

        const actionIndex = project.structure.actionPaths.indexOf(id);
        if (actionIndex > -1)
          return toClientActionCode(project.actions[actionIndex]);

        const loaderIndex = project.structure.loaderPaths.indexOf(id);
        if (loaderIndex > -1)
          return toClientLoaderCode(project.loaders[loaderIndex]);

        if (project.structure.middlewarePaths.includes(id)) {
          console.warn(`Warning: ${id} should be imported in web`);
          return `export {};`;
        }
      }
    },

    async config(config, env) {
      if (env.command === "build") {
        // build client
        if (!config.build?.ssr) {
          const { entry, components } = await getEntries();

          return {
            build: {
              rollupOptions: {
                input: [entry, ...components],
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
