import type { Plugin } from "vite";
import { Hono } from "hono";
import { resolve, staticAdapterId } from "../vmod.ts";
import path, { join } from "path";
import type { ServerManifest, Directory } from "@biliblitz/blitz/server";
import { writeFile, mkdir, unlink } from "node:fs/promises";
import { cp } from "fs/promises";
import type { RedirectStatusCode } from "hono/utils/http-status";
import { cyan, gray, green, white } from "kolorist";

export type Options = {
  /** @example "https://yoursite.com" */
  origin: string;
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
import server from "./src/entry.static.tsx";
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
  console.log(`${cyan(`blitz`)} ${green("generating static pages...")}`);

  const outdir = "dist/static";
  const pathnames = [] as string[];

  const env = { params: new Map() };
  async function dfs({ route, children }: Directory, current: string = "") {
    if (route.index !== null) pathnames.push(current);
    for (const [dirname, child] of children) {
      if (dirname.startsWith("[") && dirname.endsWith("]")) {
        // if (child.route.static === null)
        //   throw new Error(
        //     `static.ts is missing for route "${current + dirname + "/"}"`,
        //   );
        // const param = dirname === "[...]" ? "$" : dirname.slice(1, -1);
        // const static1 = manifest.statics[child.route.static];
        // const possibles = await static1(env);
        // for (const possible of possibles) {
        //   env.params.set(param, possible);
        //   await dfs(child, current + possible + "/");
        // }
        // env.params.delete(param);
        throw new Error("Todo");
      } else if (dirname.startsWith("(") && dirname.endsWith(")")) {
        await dfs(child, current);
      } else {
        await dfs(child, current + dirname + "/");
      }
    }
  }
  await dfs(manifest.directory);

  const redirects: Redirect[] = [];
  const headers: AdditionHeader[] = [];

  const app = new Hono().basePath(manifest.base);
  app.route("/", server);

  async function handleRequest(
    pathname: string,
    dirname: string,
    filename: string,
  ) {
    const request = new Request(new URL(origin + manifest.base + pathname));
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
    const filepath = path.join(dirname, filename);
    await mkdir(dirname, { recursive: true });
    await writeFile(filepath, buffer);

    if (filename === "index.html") {
      console.log(gray(dirname) + white("index.html"));
    }
  }

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

  // _redirects

  await writeFile(
    join(outdir, "_redirects"),
    redirects
      .map(
        (redr) =>
          `${manifest.base}${redr.source} ${redr.destination} ${redr.code}`,
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
