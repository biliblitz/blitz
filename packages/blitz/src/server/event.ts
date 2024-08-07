import type { Loader, LoaderReturnValue } from "./loader.ts";
import type { Context, Next } from "hono";
import type { ServerManifest } from "./build.ts";
import { createServerRuntime } from "../client/runtime.tsx";
import type { Action, ActionReturnValue } from "./action.ts";

export type Layer = {
  id: number;
  loaders: Loader[];
};

export function createFetchEvent(context: Context, manifest: ServerManifest) {
  const loaderStore = new Map<string, LoaderReturnValue>();
  const actions = new Map<string, Action>();
  const layers = [] as number[];

  return {
    async runMiddleware(id: number, next: Next) {
      const middleware = manifest.middlewares[id];
      if (middleware) await middleware(context, next);
      else await next();
    },

    async runLayer(id: number) {
      for (const loader of manifest.loaders[id]) {
        const data = await loader._fn!(context);
        loaderStore.set(loader._ref!, data);
      }
      layers.push(id);
    },

    async registerActions(id: number) {
      for (const action of manifest.actions[id]) {
        actions.set(action._ref!, action);
      }
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

    get runtime() {
      return createServerRuntime(manifest, this);
    },
  };
}

export type FetchEvent = ReturnType<typeof createFetchEvent>;
export type LoaderStore = [string, LoaderReturnValue][];
