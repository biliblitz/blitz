import { access, constants, readFile } from "node:fs/promises";
import type { ManifestChunk } from "vite";
import type { Graph } from "@biliblitz/blitz/server";

export async function loadClientGraph(): Promise<Graph> {
  const viteManifestPath = "./dist/client/.vite/manifest.json";
  try {
    await access(viteManifestPath, constants.R_OK);
  } catch {
    throw new Error("Please build client first");
  }

  const viteManifest = JSON.parse(
    await readFile(viteManifestPath, "utf8"),
  ) as Record<string, ManifestChunk>;

  const entry = viteManifest["src/entry.client.tsx"].file;
  const styles = viteManifest["src/entry.client.tsx"].css || [];

  return { entry, styles };
}

export async function loadDevGraph(): Promise<Graph> {
  return { entry: "src/entry.client.tsx", styles: [] };
}
