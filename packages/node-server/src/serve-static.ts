import { ReadStream, createReadStream } from "fs";
import { join, relative } from "node:path/posix";
import { HandlerMiddle } from "./index.ts";
import { access, constants, lstat } from "fs/promises";
import { getMimeType } from "./mime.ts";

export type ServeStaticOptions = {
  /** @default "." */
  root?: string;
  /** @default "index.html" */
  index?: string | false;
  /** @default "/" */
  base?: string;
};

const createStreamBody = (stream: ReadStream) => {
  return new ReadableStream({
    start(controller) {
      stream.on("data", (chunk) => controller.enqueue(chunk));
      stream.on("end", () => controller.close());
    },
    cancel() {
      stream.destroy();
    },
  });
};

export const serveStatic = <T>(
  options: ServeStaticOptions,
): HandlerMiddle<T> => {
  const root = join(options.root || ".", ".");
  const index = options.index ?? "index.html";
  const base = options.base || "/";
  const hasIndex = typeof index === "string";

  return async (req) => {
    const url = new URL(req.url);
    let pathname = url.pathname;

    if (!pathname.startsWith(base)) {
      return null;
    }
    pathname = decodeURIComponent(pathname.slice(base.length - 1));

    let path = join(root, pathname);
    if (hasIndex && path.endsWith("/")) {
      path += index;
    }

    // TODO: add some tests here
    // security check
    const rel = relative(root, path);
    if (!rel || rel.startsWith("..")) {
      return null;
    }

    try {
      await access(path, constants.R_OK);
    } catch (e) {
      return null;
    }

    const stat = await lstat(path);

    if (stat.isDirectory()) {
      if (!pathname.endsWith("/")) {
        url.pathname += "/";
        return Response.redirect(url, 308);
      }
      // when visit /foo/ and /foo/index.html is a directory
      // we have no idea how to handle it, just passing it.
      return null;
    }

    const headers = new Headers();

    const mimeType = getMimeType(path);
    if (mimeType) {
      headers.append("Content-Type", mimeType);
    }

    const size = stat.size;

    if (req.method === "HEAD") {
      headers.append("Content-Length", size.toString());
      return new Response(null, { status: 200, headers });
    }

    if (req.method === "OPTIONS") {
      headers.append("Allow", "OPTIONS, GET, HEAD");
      return new Response(null, { status: 200, headers });
    }

    if (req.method !== "GET") {
      return new Response(null, { status: 405, headers });
    }

    headers.append("Accept-Ranges", "bytes");
    headers.append("Last-Modified", stat.ctime.toUTCString());

    const range = req.headers.get("range") || "";

    if (!range) {
      headers.append("Content-Length", size.toString());
      const body = createStreamBody(createReadStream(path));
      return new Response(body, { status: 200, headers });
    }

    const parts = range.replace(/bytes=/, "").split("-", 2);
    const start = parts[0] ? parseInt(parts[0], 10) : 0;
    let end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
    if (end > stat.size - 1) end = stat.size - 1;
    if (start > end) throw new Error("Invalid range");

    const chunksize = end - start + 1;
    const body = createStreamBody(createReadStream(path, { start, end }));

    headers.append("Content-Length", chunksize.toString());
    headers.append("Content-Range", `bytes ${start}-${end}/${stat.size}`);

    return new Response(body, { status: 206, headers });
  };
};
