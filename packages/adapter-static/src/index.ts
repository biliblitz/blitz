import { Hono } from "hono";
import { cyan, gray, green, white } from "kolorist";
import { join } from "node:path";
import { writeFile, mkdir, unlink, cp } from "node:fs/promises";
import { resolve, staticAdapterId } from "./vmod.ts";
import type { Plugin } from "vite";
import type { ServerManifest, Directory } from "@biliblitz/blitz/server";
import type { RedirectStatusCode } from "hono/utils/http-status";

export type Options = {
  /** @example "https://yoursite.com" */
  origin: string;
  /** @default true */
  sitemap?: boolean;
};

const originRegex = /^https?:\/\/(?:[a-z0-9\-]+\.)*[a-z0-9\-]+$/;

type Redirect = {
  source: string;
  destination: string;
  code: RedirectStatusCode;
};

type AdditionHeader = {
  source: string;
  headers: [string, string][];
};

export function staticAdapter(options: Options): Plugin {
  if (!originRegex.test(options.origin))
    console.warn(`SSG: origin "${options.origin}" seems to be invalid`);

  options.sitemap ??= true;

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
          return staticAdapterEntryCode(options);
      }
    },

    config() {
      return {
        build: {
          target: "esnext",
          outDir: "dist/static",
          rollupOptions: {
            input: [staticAdapterId],
            output: {
              entryFileNames: "_server.js",
              assetFileNames: "build/assets/[hash].[ext]",
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

const staticAdapterEntryCode = (options: Options) => `
import server from "./src/entry.static.ts";
import { manifest } from "blitz:manifest/server";
import { generate } from "@biliblitz/adapter-static";

await generate(server, manifest, ${JSON.stringify(options)});
`;

export async function generate(
  server: Hono,
  manifest: ServerManifest,
  options: Options,
) {
  console.log("");
  console.log(`${cyan(`blitz`)} ${green("generating static pages...")}`);

  const outdir = "dist/static";
  const pathnames = [] as string[];

  async function dfs(
    { route, children }: Directory,
    env: Record<string, string> = {},
    current: string = "",
  ) {
    if (route.index !== null) pathnames.push(current);
    for (const [dirname, child] of children) {
      if (dirname.startsWith("[") && dirname.endsWith("]")) {
        const paths =
          child.route.layout == null
            ? null
            : manifest.paths[child.route.layout];
        if (!paths) {
          throw new Error(
            "dynamic routes must have `export const paths = ...` in layout",
          );
        }
        const name =
          dirname.startsWith("[[") && dirname.endsWith("]]")
            ? dirname.slice(2, -2)
            : dirname.slice(1, -1);
        for (const path of await paths(env)) {
          await dfs(child, { ...env, [name]: path }, current + path + "/");
        }
      } else if (dirname.startsWith("(") && dirname.endsWith(")")) {
        await dfs(child, { ...env }, current);
      } else {
        await dfs(child, { ...env }, current + dirname + "/");
      }
    }
  }
  await dfs(manifest.directory);

  const redirects: Redirect[] = [];
  const headers: AdditionHeader[] = [];

  const app = new Hono().basePath(manifest.base);
  app.route("/", server);

  const handleRequest = async (
    pathname: string,
    dirname: string,
    filename: string,
  ) => {
    const request = new Request(
      new URL(options.origin + manifest.base + pathname),
    );
    const response = await app.fetch(request);

    // handle server explosion
    if (response.status >= 500) {
      throw new Error("Server exploded, stopping...");
    }

    // add additional headers
    const additional: [string, string][] = [];
    response.headers.forEach((value, key) => {
      // console.log(`${key}: ${value}`);
      const lower = key.toLowerCase();
      if (lower !== "location" && lower !== "content-type") {
        additional.push([key, value]);
      }
    });
    if (additional.length > 0) {
      headers.push({
        source: pathname,
        headers: additional,
      });
    }

    // handle redirect
    if ([301, 302, 307, 308].includes(response.status)) {
      const location = response.headers.get("Location")!;
      redirects.push({
        source: pathname,
        destination: location,
        code: response.status as RedirectStatusCode,
      });

      if (filename === "index.html") {
        console.log(
          gray(dirname) + white("index.html") + " -> " + gray(location),
        );
      }
      return;
    }

    // write response to fs
    const buffer = new Uint8Array(await response.arrayBuffer());
    const filepath = join(dirname, filename);
    await mkdir(dirname, { recursive: true });
    await writeFile(filepath, buffer);

    if (filename === "index.html") {
      console.log(gray(dirname) + white("index.html"));
    }
  };

  const start = Date.now();
  for (const pathname of pathnames) {
    const dirname = outdir + "/" + pathname;
    await handleRequest(pathname, dirname, "index.html");
    await handleRequest(pathname + "_data.json", dirname, "_data.json");
  }
  const end = Date.now();

  console.log(
    green(`✓ generated ${pathnames.length} pages in ${end - start}ms.`),
  );

  // sitemaps
  if (options.sitemap) {
    const sitemap = [
      `<?xml version="1.0" encoding="UTF-8"?>`,
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
      ...pathnames.map(
        (pathname) =>
          `<url><loc>${options.origin + manifest.base + pathname}</loc></url>`,
      ),
      `</urlset>`,
    ].join("\n");
    await writeFile(join(outdir, "sitemap.xml"), sitemap);
  }

  // _redirects

  await writeFile(
    join(outdir, "_redirects"),
    redirects
      .map(
        (redr) =>
          `${manifest.base + redr.source} ${redr.destination} ${redr.code}`,
      )
      .join("\n"),
  );

  // _headers

  await writeFile(
    join(outdir, "_headers"),
    headers
      .map((hdr) =>
        [
          `${manifest.base}${hdr.source}`,
          ...hdr.headers.map(([key, value]) => `  ${key}: ${value}`),
        ].join("\n"),
      )
      .join("\n\n"),
  );

  // copy assets

  await cp("dist/client/build", "dist/static/build", { recursive: true });

  // service worker

  // TODO
}
