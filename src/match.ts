import { Route } from "./scan.ts";

type Resolve = (path: string) => Route[] | null;

const find = <T, R>(arr: T[], fn: (t: T) => R | null) => {
  for (const elem of arr) {
    const value = fn(elem);
    if (value !== null) {
      return value;
    }
  }
  return null;
};

export function resolveRoute(
  route: Route,
  subroutes: Array<[string, Resolve]>
): Resolve {
  const fakes = new Array<Resolve>();
  const params = new Array<Resolve>();
  const catches = new Array<Resolve>();
  const matches = new Map<string, Resolve>();

  for (const [dir, res] of subroutes) {
    if (dir === "[...]") catches.push(res);
    else if (dir.startsWith("[") && dir.endsWith("]")) params.push(res);
    else if (dir.startsWith("(") && dir.endsWith(")")) fakes.push(res);
    else matches.set(dir, res);
  }

  return (path) => {
    if (path === "/") {
      return route.index === null ? null : [route];
    }

    const index = path.slice(1).indexOf("/") + 1;
    const segment = path.slice(1, index);
    const remains = path.slice(index);

    // path = '/foo/bar/'
    // segment = 'foo'
    // remains = '/bar/'

    return (
      (
        matches.get(segment)?.(remains) ||
        find(fakes, (cb) => cb(path)) ||
        find(params, (cb) => cb(remains)) ||
        find(catches, (cb) => cb("/"))
      )?.concat(route) || null
    );
  };
}
