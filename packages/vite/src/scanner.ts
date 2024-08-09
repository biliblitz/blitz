import { join } from "node:path";
import { readdir, stat } from "node:fs/promises";
import type { Directory, Route } from "@biliblitz/blitz/server";

export const isIndex = (filename: string) =>
  /^index\.(?:[cm]?[jt]sx?|mdx?|vue)$/i.test(filename);
export const isError = (filename: string) =>
  /^error\.(?:[cm]?[jt]sx?|mdx?|vue)$/i.test(filename);
export const isLayout = (filename: string) =>
  /^layout\.(?:[cm]?[jt]sx?|mdx?|vue)$/i.test(filename);

export const isLayer = (filename: string) =>
  /\/(?:index|layout)\.(?:[cm]?[jt]sx?|mdx?|vue)$/i.test(filename);

export async function scanProjectStructure(entrance: string) {
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
