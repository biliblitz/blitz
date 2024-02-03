import { Plugin } from "vite";
import { resolve, staticAdapterId } from "../build/vmod.ts";
import { join } from "path";
import { unlink } from "fs/promises";

export type Options = {
  /** @example "https://yoursite.com" */
  origin: string;
};

const originRegex = /^https?:\/\/(?:[a-zA-Z0-9\-]+\.)*[a-zA-Z0-9\-]+$/;

export function staticAdapter(options: Options): Plugin {
  if (!originRegex.test(options.origin))
    console.warn(`SSG: origin "${options.origin}" seems to be invalid`);

  return {
    name: "blitz-static-adapter",

    resolveId(id) {
      switch (id) {
        case staticAdapterId:
          return resolve(staticAdapterId);
      }
    },

    load(id) {
      switch (id) {
        case resolve(staticAdapterId):
          return staticAdapterEntryCode(options.origin);
      }
    },

    config() {
      return {
        build: {
          target: "esnext",
          rollupOptions: {
            input: [staticAdapterId],
            output: {
              entryFileNames: "_server.js",
            },
          },
        },
      };
    },
    async closeBundle() {
      const cwd = process.cwd();
      const filePath = join(cwd, "dist/static/_server.js");
      await import(filePath);
      await unlink(filePath);
    },
  };
}

const staticAdapterEntryCode = (origin: string) => `
import server from "./app/entry.static.tsx";
import { manifest } from "blitz:manifest/server";
import { writeFile, mkdir } from "node:fs/promises";

const outdir = "dist/static";
const origin = ${JSON.stringify(origin)};
const pathnames = [];

function dfs(current, [route, children]) {
  if (route.index !== null)
    pathnames.push(current);
  for (const [dirname, child] of children) {
    if (dirname === "[...]")
      throw new Error("Dynamic route is not supported in static generation");
    else if (dirname.startsWith("[") && dirname.endsWith("]"))
      throw new Error("Dynamic route is not supported in static generation");
    else if (dirname.startsWith("(") && dirname.endsWith(")"))
      dfs(current, child);
    else
      dfs(current + dirname + "/", child);
  }
}
dfs("/", manifest.directory);

async function get(url) {
  const request = new Request(url);
  const response = await server(request);
  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
}

for (const pathname of pathnames) {
  const dirname = outdir + pathname;
  await mkdir(dirname, { recursive: true });
  const index = await get(new URL(origin + pathname));
  await writeFile(dirname + "index.html", index);
  const json = await get(new URL(origin + pathname + "_data.json"));
  await writeFile(dirname + "_data.json", json);
  console.log(dirname + "index.html");
}
`;
