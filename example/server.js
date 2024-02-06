import { serveStatic } from "@biliblitz/node-server";
import { chain, when, startsWith } from "@biliblitz/node-server/tools";
import { serve } from "@hono/node-server";

import server from "./dist/server/entry.server.js";

const assets = serveStatic({ root: "./dist/client/" });
const fetch = chain(when(startsWith("/build/"), assets), server);

serve({ fetch }, (info) => {
  console.log(`Listening on http://localhost:${info.port}/`);
});
