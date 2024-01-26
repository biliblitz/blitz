import type { Directory, Route } from "../build/scanner.ts";

export type Params = [string, string][];
export type ParamsMap = Map<string, string>;
export type ResolveResult = {
  routes: Route[];
  params: Params;
};
export type Router = (pathname: string) => ResolveResult | null;

export function createRouter(
  route: Route,
  subroutes: [string, Router][],
): Router {
  const fakes = new Array<Router>();
  const params = new Map<string, Router>();
  const catches = new Array<Router>();
  const matches = new Map<string, Router>();

  for (const [dir, res] of subroutes) {
    if (dir === "[...]") catches.push(res);
    else if (dir.startsWith("[") && dir.endsWith("]"))
      params.set(dir.slice(1, -1), res);
    else if (dir.startsWith("(") && dir.endsWith(")")) fakes.push(res);
    else matches.set(dir, res);
  }

  return (path) => {
    if (path === "/") {
      if (route.index === null) {
        return null;
      } else {
        return { routes: [route], params: [] };
      }
    }

    const index = path.slice(1).indexOf("/") + 1;
    const segment = path.slice(1, index);
    const remains = path.slice(index);

    // path    = '/foo/bar/'
    // segment = 'foo'
    // remains = '/bar/'

    let ret: ResolveResult | null = null;

    // handle matches
    if (ret === null) {
      const resolve = matches.get(segment);
      if (resolve) {
        ret = resolve(remains);
      }
    }

    // handle fakes
    if (ret === null) {
      for (const resolve of fakes) {
        ret = resolve(path);
        if (ret) break;
      }
    }

    // handle params
    if (ret === null) {
      for (const [param, resolve] of params.entries()) {
        ret = resolve(remains);
        ret?.params.push([param, segment]);
        if (ret) break;
      }
    }

    // handle catches
    if (ret === null) {
      for (const resolve of catches) {
        ret = resolve("/");
        ret?.params.push(["$", path.slice(1, -1)]);
        if (ret) break;
      }
    }

    // append route into routes
    ret?.routes.unshift(route);

    return ret;
  };
}

export function resolveRouter(directory: Directory): Router {
  return createRouter(
    directory.route,
    directory.children.map(([name, sub]) => [name, resolveRouter(sub)]),
  );
}
