import { VNode } from "preact";
import { render } from "preact-render-to-string";

import { Runtime, RuntimeProvider } from "../client/runtime.ts";
import { ServerManifest } from "./build.ts";
import { createRouter } from "./router.ts";
import { FetchEvent, createFetchEvent } from "./event.ts";
import { Hono } from "hono";

export type Server<T> = (req: Request, t?: T) => Promise<Response>;

export type ServerOptions = {
  manifest: ServerManifest;
};

declare module "hono" {
  interface ContextRenderer {
    (runtime: Runtime): Promise<Response>;
  }

  interface ContextVariableMap {
    event: FetchEvent;
  }
}

export function createServer(vnode: VNode, { manifest }: ServerOptions) {
  const app = new Hono().basePath(manifest.base);

  app.use(async (c, next) => {
    c.setRenderer(async (runtime) => {
      const html = render(
        <RuntimeProvider value={runtime}>{vnode}</RuntimeProvider>,
      );
      return c.html("<!DOCTYPE html>" + html);
    });
    c.set("event", createFetchEvent(c, manifest));

    await next();
  });

  const route = createRouter(manifest.directory);
  app.route("/", route);

  return app;
}
