import { extname, join, resolve } from "node:path";
import { isJs, isJsOrMdx } from "../utils/ext.ts";
import { readFile, readdir, stat } from "node:fs/promises";
import { DuplicateError } from "../utils/errors.ts";
import { init, parse } from "es-module-lexer";
import { hashRef, toBase64 } from "../utils/crypto.ts";

await init;

function getFilenameWithoutExt(filename: string) {
  const ext = extname(filename);
  return ext ? filename.slice(0, -ext.length) : filename;
}

function isNameOf(name: string, filename: string) {
  return getFilenameWithoutExt(filename) === name;
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
  return isJs(filename) && isNameOf("loader", filename);
}

function isAction(filename: string) {
  return isJs(filename) && isNameOf("action", filename);
}

export type Route = {
  index: number | null;
  error: number | null;
  layout: number | null;
  loaders: number | null;
  actions: number | null;
  middleware: number | null;
};

export type Directory = {
  route: Route;
  children: [string, Directory][];
};

export async function scanProjectStructure(entrance: string) {
  entrance = resolve(entrance);
  console.log(`start scanning from ${entrance}`);

  const loaderPaths: string[] = [];
  const actionPaths: string[] = [];
  const componentPaths: string[] = [];
  const middlewarePaths: string[] = [];

  function registerComponent(filePath?: string) {
    if (!filePath) return null;
    return componentPaths.push(filePath) - 1;
  }

  function registerMiddleware(filePath?: string) {
    if (!filePath) return null;
    return middlewarePaths.push(filePath) - 1;
  }

  function registerLoader(filePath?: string) {
    if (!filePath) return null;
    return loaderPaths.push(filePath) - 1;
  }

  function registerAction(filePath?: string) {
    if (!filePath) return null;
    return actionPaths.push(filePath) - 1;
  }

  async function scanDirectory(dirPath: string): Promise<Directory> {
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

    // collect every files
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
      throw new DuplicateError("index page", indexPaths[1]);
    }
    if (errorPaths.length > 1) {
      throw new DuplicateError("error page", indexPaths[1]);
    }
    if (layoutPaths.length > 1) {
      throw new DuplicateError("layout page", layoutPaths[1]);
    }
    if (loaderPaths.length > 1) {
      throw new DuplicateError("loaders", loaderPaths[1]);
    }
    if (actionPaths.length > 1) {
      throw new DuplicateError("actions", actionPaths[1]);
    }
    if (middlewarePaths.length > 1) {
      throw new DuplicateError("middleware", middlewarePaths[1]);
    }

    // register everything
    const index = registerComponent(indexPaths.at(0));
    const error = registerComponent(errorPaths.at(0));
    const layout = registerComponent(layoutPaths.at(0));
    const loaders = registerLoader(loaderPaths.at(0));
    const actions = registerAction(actionPaths.at(0));
    const middleware = registerMiddleware(middlewarePaths.at(0));

    const directory: Directory = {
      route: { index, error, layout, loaders, actions, middleware },
      children: [],
    };

    for (const dirname of dirnames) {
      directory.children.push([
        dirname,
        await scanDirectory(join(dirPath, dirname)),
      ]);
    }

    return directory;
  }

  const directory = await scanDirectory(entrance);

  return {
    directory,
    loaderPaths,
    actionPaths,
    componentPaths,
    middlewarePaths,
  };
}

export type ProjectStructure = Awaited<ReturnType<typeof scanProjectStructure>>;

export async function parseAction(actionPath: string, index: number) {
  const source = await readFile(actionPath, "utf8");
  const [_, exports] = parse(source);
  if (!exports.length) {
    throw new Error(`No action export in ${actionPath}`);
  }
  return await Promise.all(
    exports
      .map((e) => e.n)
      .map(async (name) => ({
        name: name,
        ref: await hashRef(`action-${index}-${name}`),
      })),
  );
}

export async function parseLoader(loaderPath: string, index: number) {
  const source = await readFile(loaderPath, "utf8");
  const [_, exports] = parse(source);
  if (!exports.length) {
    throw new Error(`No loader export in ${loaderPath}`);
  }
  return await Promise.all(
    exports
      .map((e) => e.n)
      .map(async (name) => ({
        name: name,
        ref: await hashRef(`loader-${index}-${name}`),
      })),
  );
}

export async function parseMiddleware(middlewarePath: string, index: number) {
  const source = await readFile(middlewarePath, "utf8");
  const [_, exports] = parse(source);
  const middleware = exports.find((e) => e.n === "default");
  if (!middleware) {
    throw new Error(`No default export in ${middlewarePath}`);
  }
  return { ref: await hashRef(`middleware-${index}`) };
}

export function toClientManifestCode(structure: ProjectStructure) {
  return [
    /** @see https://vitejs.dev/guide/backend-integration.html */
    `import "vite/modulepreload-polyfill";`,
    ...structure.componentPaths.map(
      (filePath, i) => `import c${i} from "${filePath}";`,
    ),

    `export const components = [${structure.componentPaths.map((_, i) => `c${i}`).join(", ")}];`,
    `export const actions = [];`,
    `export const loaders = [];`,
    `export const middlewares = [];`,
  ].join("\n");
}

export function toServerManifestCode(structure: ProjectStructure) {
  return [
    ...structure.componentPaths.map(
      (filePath, i) => `import c${i} from "${filePath}";`,
    ),
    ...structure.actionPaths.map(
      (filePath, i) => `import * as a${i} from "${filePath}";`,
    ),
    ...structure.loaderPaths.map(
      (filePath, i) => `import * as l${i} from "${filePath}";`,
    ),
    ...structure.middlewarePaths.map(
      (filePath, i) => `import m${i} from "${filePath}";`,
    ),

    `export const components = [${structure.componentPaths.map((_, i) => `c${i}`).join(", ")}];`,
    `export const actions = [${structure.actionPaths.map((_, i) => `a${i}`).join(", ")}];`,
    `export const loaders = [${structure.loaderPaths.map((_, i) => `l${i}`).join(", ")}];`,
    `export const middlewares = [${structure.middlewarePaths.map((_, i) => `m${i}`).join(", ")}];`,
  ].join("\n");
}