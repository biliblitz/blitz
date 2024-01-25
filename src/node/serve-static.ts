import { ReadStream, createReadStream } from "fs";
import { getMimeType } from "hono/utils/mime";
import { HandlerMiddle } from "./index.ts";
import { join } from "node:path/posix";
import { access, constants, lstat } from "fs/promises";

export type ServeStaticOptions = {
  /** @default "./" */
  root?: string;
  /** @default "index.html" */
  index?: string;
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
  const root = options.root || ".";
  const index = options.index || "index.html";

  return async (req) => {
    const url = new URL(req.url);
    const filename = decodeURIComponent(url.pathname);

    // TODO: security test here
    let path = join(root, filename);
    if (path.endsWith("/")) path += index;
    path = `./${path}`;

    try {
      await access(path, constants.R_OK);
    } catch (e) {
      return null;
    }

    const headers = new Headers();

    const mimeType = getMimeType(path);
    if (mimeType) {
      headers.append("Content-Type", mimeType);
    }

    const stat = await lstat(path);
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
