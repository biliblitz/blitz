import {
  LOADERS_SYMBOL,
  MANIFEST_SYMBOL,
  type Runtime,
} from "../client/runtime.ts";
import type { Env, ServerManifest } from "./types.ts";
import {
  type ErrorResponse,
  type RedirectResponse,
  createHonoRouter,
} from "./router.ts";
import { type FetchEvent, createFetchEvent } from "./event.ts";
import { Hono, type Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { RedirectException } from "./exception.ts";
import { shallowRef, type Plugin } from "vue";

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

type Options = {
  runtime: Runtime;
  manifest: ServerManifest;
};

export function createServerBlitz({ runtime, manifest }: Options): Plugin {
  return {
    install(app) {
      app
        .provide(LOADERS_SYMBOL, shallowRef(new Map(runtime.loaders)))
        .provide(MANIFEST_SYMBOL, manifest);
    },
  };
}

export type ServerRenderer = (
  ctx: Context<{ Bindings: Env }>,
  runtime: Runtime,
) => Response | Promise<Response>;

export function createServer(
  render: ServerRenderer,
  { manifest }: ServerOptions,
) {
  const app = new Hono<{ Bindings: Env }>();

  app.use(async (c, next) => {
    c.setRenderer(async (runtime) => {
      return await render(c, runtime);
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
