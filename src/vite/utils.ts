import { ServerResponse } from "http";
import type { Connect } from "vite";

export function convertToRequest(req: Connect.IncomingMessage) {
  const method = req.method || "GET";
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  const headers = new Headers();
  for (let i = 0; i < req.rawHeaders.length; i += 2) {
    headers.append(req.rawHeaders[i], req.rawHeaders[i + 1]);
  }

  return new Request(
    url,
    ["GET", "HEAD"].includes(method)
      ? { method, headers }
      : { method, headers, ...({ body: req, duplex: "half" } as any) }
  );
}

export async function writeToResponse(res: ServerResponse, response: Response) {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.appendHeader(key, value));
  const body = await response.arrayBuffer();
  res.end(new Uint8Array(body));
}
