import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";

const app = new Hono();

app.use(
  "/base/*",
  serveStatic({
    root: "./dist/static/",
    rewriteRequestPath: (x) => x.slice(5),
  }),
);

serve(app, (info) => {
  console.log(`Listening on http://localhost:${info.port}/base/`);
});
