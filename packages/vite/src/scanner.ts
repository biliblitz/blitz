import { join, resolve } from "node:path";
import { readdir, readFile, stat } from "node:fs/promises";
import { isMdx, isVue } from "./utils/ext.ts";
import { parse } from "@swc/core";
import { analyze, type AnalyzeResult } from "./analyze.ts";
import type { Directory, Route } from "@biliblitz/blitz/server";

async function analyzeCode(code: string, index: number) {
  const module = await parse(code, { syntax: "typescript", tsx: true });
  return analyze(module, index);
}

const isIndex = (filename: string) =>
  /^index\.(?:[cm]?[jt]sx?|mdx?|vue)$/i.test(filename);
// const isError = (filename: string) =>
//   /^error\.(?:[cm]?[jt]sx?|mdx?|vue)$/i.test(filename);
const isLayout = (filename: string) =>
  /^layout\.(?:[cm]?[jt]sx?|mdx?|vue)$/i.test(filename);

export async function scanProjectStructure(entrance: string) {
  entrance = resolve(entrance);

  const componentPaths: string[] = [];
  const registerComponent = (filePath?: string) =>
    filePath ? componentPaths.push(filePath) - 1 : null;

  const scan = async (dirPath: string): Promise<Directory> => {
    const filenames: string[] = [];
    const dirnames: string[] = [];

    for (const entry of await readdir(dirPath)) {
      const stats = await stat(join(dirPath, entry));
      if (stats.isFile()) filenames.push(entry);
      if (stats.isDirectory()) dirnames.push(entry);
    }

    const indexPaths: string[] = [];
    const layoutPaths: string[] = [];

    // collect every files
    for (const filename of filenames) {
      const filePath = join(dirPath, filename);
      if (isIndex(filename)) indexPaths.push(filePath);
      if (isLayout(filename)) layoutPaths.push(filePath);
    }

    // Test conflit files
    if (indexPaths.length > 1)
      throw new Error(`Multiple index page found: ${indexPaths[1]}`);
    if (layoutPaths.length > 1)
      throw new Error(`Multiple layout page found: ${layoutPaths[1]}`);

    // register everything
    const index = registerComponent(indexPaths[0]);
    const layout = registerComponent(layoutPaths[0]);

    const route: Route = { index, layout };
    const children: [string, Directory][] = [];

    for (const dirname of dirnames) {
      children.push([dirname, await scan(join(dirPath, dirname))]);
    }

    return { route, children };
  };

  const directory = await scan(entrance);

  return {
    directory,
    componentPaths,
  };
}

export type ProjectStructure = Awaited<ReturnType<typeof scanProjectStructure>>;

export async function analyzeLayoutOrIndex(
  filePath: string,
  index: number,
): Promise<AnalyzeResult> {
  if (isMdx(filePath)) {
    return {
      action: [],
      loader: [],
      component: true,
      middleware: false,
    };
  }

  // FIXME: finish scanner
  if (isVue(filePath)) {
    return {
      action: [],
      loader: [],
      component: true,
      middleware: false,
    };
  }

  const source = await readFile(filePath, "utf8");
  return await analyzeCode(source, index);
}

export async function resolveProject(structure: ProjectStructure) {
  const components = await Promise.all(
    structure.componentPaths.map((filepath, index) =>
      analyzeLayoutOrIndex(filepath, index),
    ),
  );

  return {
    raw: components,
    actions: components.map((c) => c.action),
    loaders: components.map((c) => c.loader),
    components: components.map((c) => c.component),
    middlewares: components.map((c) => c.middleware),
  };
}

export type Project = Awaited<ReturnType<typeof resolveProject>>;
