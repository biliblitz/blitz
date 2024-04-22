import type { Loader, LoaderReturnValue } from "./loader.ts";
import { Context } from "hono";
import { MetaFunction, createDefaultMeta } from "./meta.ts";
import { ServerManifest } from "./build.ts";
import { createServerRuntime } from "../client/runtime.tsx";
import { Action, ActionReturnValue } from "./action.ts";

export type Layer = {
  loaders: Loader[];
  meta: MetaFunction | null;
  id: number;
};

export function createFetchEvent(context: Context, manifest: ServerManifest) {
  const middlewareStore = new Map<string, any>();
  const loaderStore = new Map<string, LoaderReturnValue>();
  const components = [] as number[];
  const actions = new Map<string, Action>();
  const metafns = [] as MetaFunction[];

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
        metafns.push(meta);
      }
    },

    registerLayerActions(id: number | null) {
      if (id === null) return;
      for (const action of manifest.actions[id]) {
        actions.set(action._ref!, action);
      }
    },

    async runLayer(id: number | null) {
      if (id === null) return;

      await this.runLoaders(id);
      await this.runMeta(id);

      components.push(id);
    },

    async runAction<T extends ActionReturnValue>(action: Action<T>) {
      return await action._fn!(context);
    },

    findAction<T extends ActionReturnValue>(ref: string) {
      return actions.get(ref) as Action<T> | undefined;
    },

    get loaders() {
      return Array.from(loaderStore);
    },

    get metas() {
      const meta = createDefaultMeta();
      for (const metafn of metafns.reverse()) {
        metafn(context, meta);
      }
      return meta;
    },

    get components() {
      return components;
    },

    get params() {
      return Object.entries(context.req.param());
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
