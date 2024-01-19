import { extname, join, resolve } from "node:path";
import { isJs, isJsOrMdx } from "./utils/ext.ts";
import { readdir, stat } from "node:fs/promises";

function getFilenameWithoutExt(filename: string) {
  const ext = extname(filename);
  return ext ? filename.slice(0, -ext.length) : filename;
}

/**
 * @param name name of the file
 * @param filename filename to test
 * @returns filename is a javascript file and the exactly starts with `name`
 *
 * @example "${name}.ext"
 * @example "${name}.nick.ext" => false
 */
function isNameOf(name: string, filename: string) {
  return getFilenameWithoutExt(filename) === name;
}

/**
 * @param name name of the file
 * @param filename filename to test
 * @returns filename is a javascript file and the starts with `name` or `name` with a dot
 *
 * @example "${name}.ext"
 * @example "${name}.nick.ext"
 * @example "${name}.can.be.very.long.ext"
 */
function isNickOf(name: string, filename: string) {
  const filenameWithoutExt = getFilenameWithoutExt(filename);
  return (
    filenameWithoutExt === name || filenameWithoutExt.startsWith(name + ".")
  );
}

function isIndex(filename: string) {
  return isJsOrMdx(filename) && isNameOf("index", filename);
}

function isError(filename: string) {
  return isJsOrMdx(filename) && isNameOf("error", filename);
}

function isLayout(filename: string) {
  return isJsOrMdx(filename) && isNameOf("layout", filename);
}

function isMiddleware(filename: string) {
  return isJs(filename) && isNameOf("middleware", filename);
}

function isLoader(filename: string) {
  return isJs(filename) && isNickOf("loader", filename);
}

function isAction(filename: string) {
  return isJs(filename) && isNickOf("action", filename);
}

/**
 * Escape every malicious charactors for regex
 * @param str string to match
 * @returns an escaped regex string
 * @example "a.b/c" => "a\.b\/c"
 */
function escapeRegex(str: string) {
  return str.replace(/[\.\*\+\?\^\$\{\}\(\)\|\[\]\\\/]/g, "\\$&");
}

function getRouteLevel(dir: string) {
  if (dir === "[...]") {
    return 4;
  } else if (dir.startsWith("[") && dir.endsWith("]")) {
    return 3;
  } else if (dir.startsWith("(") && dir.endsWith(")")) {
    return 2;
  } else {
    return 1;
  }
}

function computeEntryRegex(dirs: string[]) {
  let exp = "";
  const params = [];

  for (const dir of dirs) {
    if (dir === "[...]") {
      exp += "/(.+)";
      params.push("$");
    } else if (dir.startsWith("[") && dir.endsWith("]")) {
      exp += "/([^/]+)";
      params.push(dir.slice(1, -1));
    } else if (dir.startsWith("(") && dir.endsWith(")")) {
      exp += "";
    } else {
      exp += "/" + escapeRegex(encodeURIComponent(dir));
    }
  }

  // Add a optional trailing slash
  const regex = new RegExp(`^${exp}/?$`, "i");
  return { regex, params };
}

export type Entry = {
  regex: RegExp;
  params: string[];
  routes: number[];
};

export type Route = {
  index: number | null;
  error: number | null;
  layout: number | null;
  loaders: number[];
  actions: number[];
  middleware: number | null;
};

export async function scanProjectStructure(entrance: string) {
  entrance = resolve(entrance);
  console.log(`start scanning from ${entrance}`);

  const routes: Route[] = [];
  const entires: Entry[] = [];
  const loaderPaths: string[] = [];
  const actionPaths: string[] = [];
  const componentPaths: string[] = [];
  const middlewarePaths: string[] = [];

  function registerEntry(dirnames: string[], routes: number[]) {
    const { regex, params } = computeEntryRegex(dirnames);
    entires.push({ regex, params, routes });
  }

  function registerDirectory(route: Route) {
    return routes.push(route) - 1;
  }

  function registerComponent(filePath: string | undefined) {
    if (!filePath) return null;
    return componentPaths.push(filePath) - 1;
  }

  function registerMiddleware(filePath: string | undefined) {
    if (!filePath) return null;
    return middlewarePaths.push(filePath) - 1;
  }

  function registerLoader(filePath: string) {
    return loaderPaths.push(filePath) - 1;
  }

  function registerAction(filePath: string) {
    return actionPaths.push(filePath) - 1;
  }

  async function scanRoute(
    dirPath: string,
    currentDirnames: string[],
    currentRoutes: number[],
  ) {
    const filenames: string[] = [];
    const dirnames: string[] = [];

    for (const entry of await readdir(dirPath)) {
      const stats = await stat(join(dirPath, entry));
      if (stats.isFile()) filenames.push(entry);
      if (stats.isDirectory()) dirnames.push(entry);
    }

    const indexPaths: string[] = [];
    const errorPaths: string[] = [];
    const layoutPaths: string[] = [];
    const loaderPaths: string[] = [];
    const actionPaths: string[] = [];
    const middlewarePaths: string[] = [];

    for (const filename of filenames) {
      const filePath = join(dirPath, filename);
      if (isIndex(filename)) indexPaths.push(filePath);
      if (isError(filename)) errorPaths.push(filePath);
      if (isLayout(filename)) layoutPaths.push(filePath);
      if (isLoader(filename)) loaderPaths.push(filePath);
      if (isAction(filename)) actionPaths.push(filePath);
      if (isMiddleware(filename)) middlewarePaths.push(filePath);
    }

    // Test conflit files
    if (indexPaths.length > 1) {
      throw new Error(
        `Multiple index page in same route found: ${indexPaths[1]}`,
      );
    }
    if (errorPaths.length > 1) {
      throw new Error(
        `Multiple error page in same route found: ${indexPaths[1]}`,
      );
    }
    if (layoutPaths.length > 1) {
      throw new Error(
        `Multiple layout page in same route found: ${layoutPaths[1]}`,
      );
    }
    if (middlewarePaths.length > 1) {
      throw new Error(
        `Multiple middleware in same route found: ${middlewarePaths[1]}`,
      );
    }

    const index = registerComponent(indexPaths.at(0));
    const error = registerComponent(errorPaths.at(0));
    const layout = registerComponent(layoutPaths.at(0));
    const loaders = loaderPaths.map((filePath) => registerLoader(filePath));
    const actions = actionPaths.map((filePath) => registerAction(filePath));
    const middleware = registerMiddleware(middlewarePaths.at(0));

    const route = registerDirectory({
      index,
      error,
      layout,
      loaders,
      actions,
      middleware,
    });

    // register entry for index
    if (index !== null) {
      registerEntry(currentDirnames, [...currentRoutes, route]);
    }

    // sort dirnames from
    // Catch -> Ignore -> Param -> Match
    dirnames.sort((a, b) => getRouteLevel(a) - getRouteLevel(b));

    for (const dirname of dirnames) {
      const newDirPath = join(dirPath, dirname);
      await scanRoute(
        newDirPath,
        [...currentDirnames, dirname],
        [...currentRoutes, route],
      );
    }
  }

  await scanRoute(entrance, [], []);

  return {
    routes,
    entires,
    loaderPaths,
    actionPaths,
    componentPaths,
    middlewarePaths,
  };
}

export type ProjectStructure = Awaited<ReturnType<typeof scanProjectStructure>>;

export function toClientManifestCode(structure: ProjectStructure) {
  const codes = [
    /** @see https://vitejs.dev/guide/backend-integration.html */
    "import 'vite/modulepreload-polyfill';",
    ...structure.componentPaths.map(
      (filePath, i) => `import c${i} from "${filePath}";`,
    ),
    `export const components = [${structure.componentPaths
      .map((_, i) => `c${i}`)
      .join(", ")}];`,
    `console.log(components)`,
  ];

  return codes.join("\n");
}
