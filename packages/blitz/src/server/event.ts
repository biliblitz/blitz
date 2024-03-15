import type { Loader, LoaderReturnValue } from "./loader.ts";
import { Context } from "hono";
import { MetaFunction, createDefaultMeta, mergeMeta } from "./meta.ts";
import { Params } from "./router.ts";
import { ServerManifest } from "./build.ts";
import { createServerRuntime } from "../client/runtime.tsx";

export type Layer = {
  loaders: Loader[];
  meta: MetaFunction | null;
  id: number;
};

export function createFetchEvent(context: Context, manifest: ServerManifest) {
  const middlewareStore = new Map<string, any>();
  const loaderStore = new Map<string, LoaderReturnValue>();
  const metas = createDefaultMeta();
  const components = [] as number[];
  const params = [] as Params;

  return {
    async runMiddleware(id: number | null) {
      if (id === null) return;

      const middleware = manifest.middlewares[id];
      const data = await middleware(context);
      middlewareStore.set(middleware._ref!, data);
    },

    async runLoaders(id: number | null) {
      if (id === null) return;

      const loaders = manifest.loaders[id];
      for (const loader of loaders) {
        const data = await loader._fn!(context);
        loaderStore.set(loader._ref!, data);
      }
    },

    async runMeta(id: number | null) {
      if (id === null) return;

      const meta = manifest.metas[id];
      if (meta) {
        const update = await meta(context);
        mergeMeta(metas, update);
      }
    },

    async runLayer(id: number | null) {
      if (id === null) return;

      await this.runLoaders(id);
      await this.runMeta(id);

      components.push(id);
    },

    appendParam(key: string, value: string) {
      params.push([key, value]);
    },

    get loaders() {
      return Array.from(loaderStore);
    },

    get metas() {
      return metas;
    },

    get components() {
      return components;
    },

    get params() {
      return params;
    },

    get url() {
      return new URL(context.req.url);
    },

    get runtime() {
      return createServerRuntime(manifest, this);
    },
  };
}

export type FetchEvent = ReturnType<typeof createFetchEvent>;
export type LoaderStore = [string, LoaderReturnValue][];
