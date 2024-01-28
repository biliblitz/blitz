import { serveStatic, chain, when, startsWith } from "@biliblitz/blitz/node";
import server from "./dist/server/entry.server.js";
import { serve } from "@hono/node-server";

const assets = serveStatic({ root: "./dist/client/" });
const fetch = chain(
  when(startsWith("/build/"), assets, server),
  () => new Response("404 Not Found", { status: 404 }),
);

serve({ fetch }, (info) => {
  console.log(`Listening on http://localhost:${info.port}/`);
});
