import { access, constants, readFile } from "node:fs/promises";
import { ManifestChunk } from "vite";

export type Graph = {
  assets: string[];
  entry: number[];
  components: number[][];
};

export async function loadClientGraph(
  entry: string,
  components: string[],
): Promise<Graph> {
  const viteManifestPath = "./dist/client/.vite/manifest.json";
  try {
    await access(viteManifestPath, constants.R_OK);
  } catch (e) {
    throw new Error("Please build client first");
  }

  const viteManifest = JSON.parse(
    await readFile(viteManifestPath, "utf8"),
  ) as Record<string, ManifestChunk>;

  const unique = <T>(t: T[]) => Array.from(new Set(t));

  const values = Object.values(viteManifest);
  const resources = unique([
    ...values.flatMap((m) => m.css || []),
    ...values.map((m) => m.file),
  ]);

  function dfsDeps(name: string) {
    const rec = viteManifest[name];
    const deps: number[] = [resources.indexOf(rec.file)];

    if (rec.css) {
      deps.push(...rec.css.map((x) => resources.indexOf(x)));
    }

    if (rec.imports) {
      for (const imp of rec.imports) {
        deps.push(...dfsDeps(imp));
      }
    }

    return deps;
  }

  return {
    assets: resources,
    entry: dfsDeps(entry),
    components: components.map((entry) => dfsDeps(entry)),
  };
}

export async function loadDevGraph(
  entry: string,
  components: string[],
): Promise<Graph> {
  return {
    assets: [entry, ...components],
    entry: [0],
    components: components.map((_, i) => [i + 1]),
  };
}