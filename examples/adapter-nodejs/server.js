import { Hono } from "hono";
import { logger } from "hono/logger";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";

import server from "./dist/nodejs/server.js";

const app = new Hono();

app.use(logger());
app.use(serveStatic({ root: "./public/" }));
app.use("/build/*", serveStatic({ root: "./dist/client/" }));
app.route("/", server);

serve(app, (info) => {
  console.log(`Listening on http://localhost:${info.port}/`);
});
