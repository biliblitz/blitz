import type { Middleware } from "./middleware.ts";
import type { Loader, LoaderReturnValue } from "./loader.ts";
import { ParamsMap, ResolveResult } from "./router.ts";
import { ServerManifest } from "../build/manifest.ts";
import { createDefaultMeta, mergeMeta } from "./meta.ts";

export type FetchEvent = {
  /**
   * Request object
   */
  request: Request;

  /**
   * Route params.
   *
   * ```js
   * // app/routes/[user]/index.tsx
   * evt.params.get("user"); // => string
   * ```
   */
  params: ParamsMap;

  /**
   * Appending headers to final response
   *
   * ```js
   * evt.headers.append("set-cookie", "session=114514");
   * ```
   */
  headers: Headers;

  /**
   * Set the status of the current response (only works on GET with pathname)
   */
  status(status: number): void;

  /**
   * Returns the return value of middleware.
   *
   * Use it only if the middleware runs before this call.
   */
  resolve<T>(reference: Middleware<T>): T;
  resolve<T extends LoaderReturnValue>(reference: Loader<T>): T;
};

export function createFetchEvent(
  manifest: ServerManifest,
  request: Request,
  { params, routes }: ResolveResult,
) {
  const headers = new Headers();

  const store = new Map<string, any>();
  let status = 200;

  const event: FetchEvent = {
    request,
    params: new Map(params),
    headers,
    status(value) {
      status = value;
    },
    resolve(reference: { _ref?: string }) {
      if (!reference._ref || !store.has(reference._ref))
        throw new Error("Invalid Middleware / Loader");
      return store.get(reference._ref);
    },
  };

  async function runMiddleware<T>(middleware: Middleware<T>) {
    const data = await middleware(event);
    store.set(middleware._ref!, data);
  }
  async function runLoader<T extends LoaderReturnValue>(loader: Loader<T>) {
    const data = await loader._fn!(event);
    store.set(loader._ref!, data);
    return [loader._ref!, data] as [string, T];
  }

  return {
    async runMetas() {
      const fns = routes
        .map((route) => route.meta)
        .filter((id): id is number => id !== null)
        .map((id) => manifest.metas[id]);

      const meta = createDefaultMeta();
      for (const fn of fns) {
        const update = await fn(event);
        mergeMeta(meta, update);
      }
      return meta;
    },

    async runLoaders() {
      const store = [] as LoaderStore;

      for (const route of routes) {
        if (route.middleware !== null) {
          await runMiddleware(manifest.middlewares[route.middleware]);
        }
      }

      for (const route of routes) {
        if (route.loaders !== null) {
          const loaders = manifest.loaders[route.loaders];
          for (const loader of loaders) {
            store.push(await runLoader(loader));
          }
        }
      }

      return store;
    },

    async runAction(ref: string) {
      const found = routes.some(
        (route) =>
          route.actions !== null &&
          manifest.actions[route.actions].some((action) => action._ref === ref),
      );

      if (!found) {
        throw new Error("Action not found");
      }

      for (const route of routes) {
        if (route.middleware !== null) {
          await runMiddleware(manifest.middlewares[route.middleware]);
        }
        if (route.actions !== null) {
          const actions = manifest.actions[route.actions];
          const action = actions.find((action) => action._ref === ref);
          if (action) {
            return await action._fn!(event);
          }
        }
      }

      throw new Error("Unreachable");
    },

    get components() {
      const components = [] as number[];
      for (const route of routes) {
        if (route.layout !== null) {
          components.push(route.layout);
        }
      }
      const last = routes.at(-1);
      if (last && last.index !== null) {
        components.push(last.index);
      }
      return components;
    },

    get status() {
      return status;
    },

    get headers() {
      return headers;
    },
  };
}

export type LoaderStore = [string, LoaderReturnValue][];
