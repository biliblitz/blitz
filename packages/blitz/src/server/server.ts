import {
  MANIFEST_SYMBOL,
  RUNTIME_SYMBOL,
  type Runtime,
} from "../client/runtime.ts";
import type { ServerManifest } from "./types.ts";
import {
  type ErrorResponse,
  type RedirectResponse,
  createHonoRouter,
} from "./router.ts";
import { type FetchEvent, createFetchEvent } from "./event.ts";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { RedirectException } from "./exception.ts";
import { renderToString } from "vue/server-renderer";
import { createSSRApp, ref, type Component } from "vue";
import { createServerHead } from "@unhead/vue";
import { renderSSRHead } from "@unhead/ssr";
import { createMemoryHistory, createRouter } from "vue-router";

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

export function createServer(App: Component, { manifest }: ServerOptions) {
  const app = new Hono();

  app.use(async (c, next) => {
    c.setRenderer(async (runtime) => {
      const app = createSSRApp(App);
      const head = createServerHead();
      const router = createRouter({
        routes: manifest.routes,
        history: createMemoryHistory(manifest.base),
      });
      app.use(head);
      app.use(router);
      app.provide(RUNTIME_SYMBOL, ref(runtime));
      app.provide(MANIFEST_SYMBOL, manifest);
      router.replace(c.req.path);
      await router.isReady();
      const ctx = {};
      const appHTML = await renderToString(app, ctx);
      const payload = await renderSSRHead(head, { omitLineBreaks: true });
      // console.log(ctx);

      return c.html(
        `<!DOCTYPE html>` +
          `<html${payload.htmlAttrs}>` +
          `<head>${payload.headTags}</head>` +
          `<body${payload.bodyAttrs}>` +
          `${payload.bodyTagsOpen}` +
          `<div id="app">${appHTML}</div>` +
          `${payload.bodyTags}` +
          `</body>` +
          `</html>`,
      );
    });
    c.set("event", createFetchEvent(c, manifest));

    await next();
  });

  // redirect tailing slash
  app.use(async (c, next) => {
    if (!c.req.path.endsWith("/_data.json") && !c.req.path.endsWith("/")) {
      const url = new URL(c.req.url);
      url.pathname += "/";
      return c.redirect(url.href, 308);
    }

    await next();
  });

  const route = createHonoRouter(manifest.directory);
  app.route("/", route);

  app.onError(async (err, c) => {
    const isDataRequest = c.req.path.endsWith("/_data.json");

    if (err instanceof RedirectException) {
      const target =
        typeof err.target === "string"
          ? new URL(err.target, c.req.url)
          : err.target;

      if (isDataRequest) {
        return c.json<RedirectResponse>({
          ok: "redirect",
          redirect: target.href,
        });
      }

      return c.redirect(target.href, err.status);
    }

    if (err instanceof HTTPException && err.res) {
      if (isDataRequest) {
        return c.json<ErrorResponse>({
          ok: "error",
          error: await err.res.text(),
          status: err.res.status,
        });
      }
      // TODO: render error page
      return err.res;
    }

    const message = err.message;
    const status = err instanceof HTTPException ? err.status : 500;

    if (isDataRequest) {
      return c.json<ErrorResponse>({
        ok: "error",
        error: message,
        status,
      });
    }
    // TODO: render error page
    return c.body(message, status);
  });

  return app;
}
