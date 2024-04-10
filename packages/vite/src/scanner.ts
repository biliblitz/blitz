import { extname, join, resolve } from "node:path";
import { isJs, isJsOrMdx, isMdx } from "./utils/ext.ts";
import { readFile, readdir, stat } from "node:fs/promises";
import { hashRef } from "./utils/crypto.ts";
import { Directory, Route } from "@biliblitz/blitz/server";
import { find_exports } from "@swwind/find-exports";

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

function isStatic(filename: string) {
  return isJs(filename) && isNameOf("static", filename);
}

function isMiddleware(filename: string) {
  return isJs(filename) && isNameOf("middleware", filename);
}

export async function scanProjectStructure(entrance: string) {
  entrance = resolve(entrance);
  // console.log(`start scanning from ${entrance}`);

  const staticPaths: string[] = [];
  const componentPaths: string[] = [];
  const middlewarePaths: string[] = [];

  const registerStatic = (filePath?: string) =>
    filePath ? staticPaths.push(filePath) - 1 : null;
  const registerComponent = (filePath?: string) =>
    filePath ? componentPaths.push(filePath) - 1 : null;
  const registerMiddleware = (filePath?: string) =>
    filePath ? middlewarePaths.push(filePath) - 1 : null;

  const scan = async (dirPath: string): Promise<Directory> => {
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
    const staticPaths: string[] = [];
    const middlewarePaths: string[] = [];

    // collect every files
    for (const filename of filenames) {
      const filePath = join(dirPath, filename);
      if (isIndex(filename)) indexPaths.push(filePath);
      if (isError(filename)) errorPaths.push(filePath);
      if (isLayout(filename)) layoutPaths.push(filePath);
      if (isStatic(filename)) staticPaths.push(filePath);
      if (isMiddleware(filename)) middlewarePaths.push(filePath);
    }

    // Test conflit files
    if (indexPaths.length > 1)
      throw new Error(`Multiple index page found: ${indexPaths[1]}`);
    if (errorPaths.length > 1)
      throw new Error(`Multiple error page found: ${errorPaths[1]}`);
    if (layoutPaths.length > 1)
      throw new Error(`Multiple layout page found: ${layoutPaths[1]}`);
    if (staticPaths.length > 1)
      throw new Error(`Multiple static found: ${staticPaths[1]}`);
    if (middlewarePaths.length > 1)
      throw new Error(`Multiple middleware found: ${middlewarePaths[1]}`);

    // register everything
    const index = registerComponent(indexPaths.at(0));
    const error = registerComponent(errorPaths.at(0));
    const layout = registerComponent(layoutPaths.at(0));
    const static1 = registerStatic(staticPaths.at(0));
    const middleware = registerMiddleware(middlewarePaths.at(0));

    const route: Route = {
      index,
      error,
      layout,
      static: static1,
      middleware,
    };
    const children: [string, Directory][] = [];

    for (const dirname of dirnames) {
      children.push([dirname, await scan(join(dirPath, dirname))]);
    }

    return { route, children };
  };

  const directory = await scan(entrance);

  return {
    directory,
    staticPaths,
    componentPaths,
    middlewarePaths,
  };
}

export type ProjectStructure = Awaited<ReturnType<typeof scanProjectStructure>>;

export type ActionMeta = { name: string; ref: string }[];
export type LoaderMeta = { name: string; ref: string }[];

export async function parseActionsAndLoaders(
  filePath: string,
  index: number,
): Promise<{
  actions: ActionMeta;
  loaders: LoaderMeta;
  hasMeta: boolean;
}> {
  if (isMdx(filePath)) return { actions: [], loaders: [], hasMeta: true };

  const source = await readFile(filePath, "utf8");
  const found = find_exports(source, ["action$", "loader$", "meta$"]);
  const actionFounds = found.filter((x) => x.callee === "action$");
  const loaderFounds = found.filter((x) => x.callee === "loader$");
  const metaFounds = found.filter((x) => x.callee === "meta$");
  return {
    actions: await Promise.all(
      actionFounds.map(async ({ name }) => ({
        name,
        ref: await hashRef(`action-${index}-${name}`),
      })),
    ),
    loaders: await Promise.all(
      loaderFounds.map(async ({ name }) => ({
        name,
        ref: await hashRef(`loader-${index}-${name}`),
      })),
    ),
    hasMeta: metaFounds.some(({ name }) => name === "meta"),
  };
}

export async function parseMiddleware(_: string, index: number) {
  return { ref: await hashRef(`middleware-${index}`) };
}

export type MiddlewareMeta = Awaited<ReturnType<typeof parseMiddleware>>;

export async function resolveProject(structure: ProjectStructure) {
  const components = await Promise.all(
    structure.componentPaths.map((filepath, index) =>
      parseActionsAndLoaders(filepath, index),
    ),
  );
  const middlewares = await Promise.all(
    structure.middlewarePaths.map(parseMiddleware),
  );

  return {
    metas: components.map((c) => c.hasMeta),
    actions: components.map((c) => c.actions),
    loaders: components.map((c) => c.loaders),
    structure,
    middlewares,
  };
}

export type Project = Awaited<ReturnType<typeof resolveProject>>;
