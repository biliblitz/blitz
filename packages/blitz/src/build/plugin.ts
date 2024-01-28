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

export async function blitzCity(): Promise<Plugin> {
  const vmods = [manifestClient, manifestServer];

  let project: Project | null = null;
  async function getProject() {
    if (!project) {
      const structure = await scanProjectStructure("./app/routes");
      project = await resolveProject(structure);
    }
    return project;
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
          return toServerManifestCode(await getProject());
      }

      // if in browser
      if (!options?.ssr) {
        const project = await getProject();

        const actionIndex = project.structure.actionPaths.indexOf(id);
        if (actionIndex > -1) {
          return toClientActionCode(project.actions[actionIndex]);
        }

        const loaderIndex = project.structure.loaderPaths.indexOf(id);
        if (loaderIndex > -1) {
          return toClientLoaderCode(project.loaders[loaderIndex]);
        }

        if (project.structure.middlewarePaths.includes(id)) {
          console.warn(`Warning: ${id} should be imported in web`);
          return `export {};`;
        }
      }
    },

    async config(config, env) {
      if (env.command === "build") {
        await getProject();

        // build client
        if (!config.build?.ssr) {
          return {
            build: {
              rollupOptions: {
                input: ["./app/entry.client.tsx"],
                output: {
                  entryFileNames: "build/[name].js",
                  chunkFileNames: "build/chunk-[hash].js",
                  assetFileNames: "build/assets/[hash].[ext]",
                },
              },
            },
          };
        }

        // build server
        else {
          return {
            build: {
              rollupOptions: {
                // FIXME: versions of "preact" and "preact-render-to-string" always mismatch
                // FIXME: so we cannot mark out library as external
                // external: [/^@biliblitz\/blitz/],
              },
            },
          };
        }
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
