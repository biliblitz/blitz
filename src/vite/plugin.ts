import type { Plugin } from "vite";
import { resolve, manifestId } from "./vmod.ts";
import { convertToRequest, writeToResponse } from "./utils.ts";

export async function blitzCity(): Promise<Plugin> {
  const vmods = [manifestId, "./app/entry.dev.tsx"];

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
          return `export const x = "manifest";`;
      }
    },

    config() {
      return {
        appType: "custom",
        build: {
          ssr: true,
          manifest: true,
          ssrManifest: true,
          rollupOptions: {
            input: [...vmods],
          },
        },
      };
    },

    configureServer(vite) {
      return () => {
        vite.middlewares.use(async (req, res, next) => {
          // invalidate old modules
          for (const vmod of vmods) {
            const node = vite.moduleGraph.getModuleById(resolve(vmod));
            if (node) {
              vite.moduleGraph.invalidateModule(node);
            }
          }

          console.log("middleware", req.url);

          const request = convertToRequest(req);

          const module = await vite.ssrLoadModule("./app/entry.dev.tsx");
          const response = module.default(request);
          await writeToResponse(res, response);
        });
      };
    },
  };
}
