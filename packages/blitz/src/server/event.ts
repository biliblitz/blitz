import type { Middleware } from "./middleware.ts";
import type { LoaderReturnValue } from "./loader.ts";
import { ParamsMap, Router } from "./router.ts";
import { ServerManifest } from "../build/manifest.ts";

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
   * Returns the return value of middleware.
   *
   * Use it only if the middleware runs before this call.
   */
  load<T>(middleware: Middleware<T>): T;
};

export function createFetchEvent(
  manifest: ServerManifest,
  router: Router,
  request: Request,
  headers: Headers,
  pathname?: string,
) {
  const url = new URL(request.url);

  const result = router(pathname || url.pathname);
  if (result === null) throw new Error("404");
  const { routes, params } = result;

  const store = new Map<string, any>();

  const event: FetchEvent = {
    request,
    params: new Map(params),
    headers,
    load(middleware) {
      if (!middleware._ref) {
        throw new Error("Invalid call to evt.load: invalid middleware");
      }
      if (!store.has(middleware._ref)) {
        throw new Error("Invalid call to evt.load: middleware not run");
      }
      return store.get(middleware._ref);
    },
  };

  async function runMiddleware<T>(middleware: Middleware<T>) {
    const data = await middleware(event);
    store.set(middleware._ref!, data);
  }

  return {
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
            store.push([loader._ref!, await loader._fn!(event)]);
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
  };
}

export type LoaderStore = [string, LoaderReturnValue][];
export type LoaderStoreMap = Map<string, LoaderReturnValue>;
