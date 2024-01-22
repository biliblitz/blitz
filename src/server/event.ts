import type { Middleware } from "./middleware.ts";
import type { LoaderFunction, LoaderReturnValue } from "./loader.ts";
import { ActionFunction, ActionReturnValue } from "./action.ts";
import { Directory } from "../build/scanner.ts";
import { resolveRouter } from "./router.ts";

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
  params: Map<string, string>;

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

export function createFetchEvent(request: Request, params: [string, string][]) {
  const headers = new Headers();
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

  return {
    async runMiddleware<T>(middleware: Middleware<T>) {
      const data = await middleware(event);
      store.set(middleware._ref!, data);
    },
    async runLoader<T extends LoaderReturnValue>(loader: LoaderFunction<T>) {
      return await loader(event);
    },
    async runAction<T extends ActionReturnValue>(action: ActionFunction<T>) {
      return await action(event);
    },
    headers,
  };
}

function getMiddleware(id: number): Middleware<any> | null {
  throw new Error("Unimplemented");
}
function getLoaders(id: number): LoaderFunction<any>[] {
  throw new Error("Unimplemented");
}
function getActions(id: number): ActionFunction<any>[] {
  throw new Error("Unimplemented");
}

export async function createLoaderRunner(
  request: Request,
  directory: Directory
) {
  const router = resolveRouter(directory);
  const url = new URL(request.url);

  const result = router(url.pathname);
  if (result === null) {
    throw new Error("404");
  }
  const { routes, params } = result;

  const event = createFetchEvent(request, params);
  const store = [] as [string, LoaderReturnValue][];

  for (const route of routes) {
    if (route.middleware !== null) {
      const middleware = getMiddleware(route.middleware);
      if (middleware) await event.runMiddleware(middleware);
    }
  }

  for (const route of routes) {
    if (route.loaders !== null) {
      const middleware = getMiddleware(route.loaders);
      if (middleware) await event.runMiddleware(middleware);
      const loaders = getLoaders(route.loaders);
      for (const loader of loaders) {
        store.push([loader._ref!, await event.runLoader(loader)]);
      }
    }
  }

  return { store, headers: event.headers };
}

export async function createActionRunner(
  request: Request,
  directory: Directory,
  actionRef: string
) {
  const router = resolveRouter(directory);
  const url = new URL(request.url);

  const result = router(url.pathname);
  if (result === null) {
    throw new Error("404");
  }
  const { routes, params } = result;

  const event = createFetchEvent(request, params);
  const index = routes.findIndex(
    (route) =>
      route.actions !== null &&
      getActions(route.actions).some((action) => action._ref === actionRef)
  );

  if (index === -1) {
    throw new Error("Action not found");
  }

  for (const route of routes.slice(0, index)) {
    if (route.middleware !== null) {
      const middleware = getMiddleware(route.middleware);
      if (middleware) await event.runMiddleware(middleware);
    }
    if (route.actions !== null) {
      const actions = getActions(route.actions);
      const action = actions.find((action) => action._ref === actionRef);
      if (action) {
        const middleware = getMiddleware(route.actions);
        if (middleware) await event.runMiddleware(middleware);
        return await event.runAction(action);
      }
    }
  }

  throw new Error("Unreachable");
}
