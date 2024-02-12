import { serveStatic } from "@biliblitz/node-server";
import { chain, startsWith, when } from "@biliblitz/node-server/tools";
import { serve } from "@hono/node-server";

const sttsrv = serveStatic({ root: "./dist/static/", base: "/base/" });
const fetch = chain(
  when(startsWith("/base/"), sttsrv),
  () => new Response(null, { status: 418 }),
);

serve({ fetch }, (info) => {
  console.log(`Listening on http://localhost:${info.port}/base/`);
});
