import { Plugin } from "vite";
import { Hono } from "hono";
import { resolve, staticAdapterId } from "../vmod.ts";
import { join } from "path";
import { ServerManifest, Directory } from "@biliblitz/blitz/server";
import { writeFile, mkdir, unlink } from "node:fs/promises";
import chalk from "chalk";
import { cp } from "fs/promises";

export type Options = {
  /** @example "https://yoursite.com" */
  origin: string;
};

const originRegex = /^https?:\/\/(?:[a-z0-9\-]+\.)*[a-z0-9\-]+$/;

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
          copyPublicDir: true,
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
import { generate } from "@biliblitz/vite/adapters/static";

await generate(server, manifest, ${JSON.stringify(origin)});
`;

export async function generate(
  server: Hono,
  manifest: ServerManifest,
  origin: string,
) {
  console.log("");
  console.log(
    `${chalk.cyan(`blitz`)} ${chalk.green("generating static pages...")}`,
  );

  const outdir = "dist/static";
  const pathnames = [] as string[];

  const env = { params: new Map() };
  async function dfs({ route, children }: Directory, current: string = "") {
    if (route.index !== null) pathnames.push(current);
    for (const [dirname, child] of children) {
      if (dirname.startsWith("[") && dirname.endsWith("]")) {
        if (child.route.static === null)
          throw new Error(
            `static.ts is missing for route "${current + dirname + "/"}"`,
          );
        const param = dirname === "[...]" ? "$" : dirname.slice(1, -1);
        const static1 = manifest.statics[child.route.static];
        const possibles = await static1(env);
        for (const possible of possibles) {
          env.params.set(param, possible);
          await dfs(child, current + possible + "/");
        }
        env.params.delete(param);
      } else if (dirname.startsWith("(") && dirname.endsWith(")")) {
        await dfs(child, current);
      } else {
        await dfs(child, current + dirname + "/");
      }
    }
  }
  await dfs(manifest.directory);

  async function get(url: URL) {
    const request = new Request(url);
    const response = await server.request(request);
    // handle redirect
    if ([301, 302, 307, 308].includes(response.status)) {
      const location = response.headers.get("Location");
      return new TextEncoder().encode(
        `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; URL=${location}" /></head><body>Redirecting to <a href="${location}">${location}</a></body></html>`,
      );
    }
    // handle server explosion
    if (response.status >= 500) {
      throw new Error("Server exploded, stopping...");
    }
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
  }

  const start = Date.now();
  for (const pathname of pathnames) {
    const dirname = outdir + "/" + pathname;
    await mkdir(dirname, { recursive: true });
    const index = await get(new URL(origin + manifest.base + pathname));
    await writeFile(dirname + "index.html", index);
    const json = await get(
      new URL(origin + manifest.base + pathname + "_data.json"),
    );
    await writeFile(dirname + "_data.json", json);
    console.log(chalk.gray(dirname) + chalk.white("index.html"));
  }
  const end = Date.now();

  console.log(
    chalk.green(`✓ generated ${pathnames.length} pages in ${end - start}ms.`),
  );

  // sitemaps

  const sitemap = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...pathnames.map(
      (pathname) =>
        `<url><loc>${origin}${manifest.base}${pathname}</loc></url>`,
    ),
    `</urlset>`,
  ].join("\n");
  await writeFile(join(outdir, "sitemap.xml"), sitemap);

  // copy assets

  await cp("dist/client/build", "dist/static/build", { recursive: true });

  // service worker

  // TODO
}
