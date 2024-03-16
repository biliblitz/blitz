import { Hono } from "hono";
import type { Directory } from "./build.ts";
import { ActionReturnValue } from "./action.ts";
import { Meta } from "./meta.ts";
import { LoaderReturnValue } from "./loader.ts";
import { HTTPException } from "hono/http-exception";

export type Params = [string, string][];
export type LoaderStore = [string, LoaderReturnValue][];

export type ErrorResponse = { ok: "error"; error: string; status: number };
export type RedirectResponse = { ok: "redirect"; redirect: string };

export type ActionResponse<T = ActionReturnValue> =
  | {
      ok: "action";
      // meta: Meta;
      // params: Params;
      // loaders: LoaderStore;
      // components: number[];
      action: T;
    }
  | ErrorResponse
  | RedirectResponse;

export type LoaderResponse =
  | {
      ok: "loader";
      meta: Meta;
      params: Params;
      loaders: LoaderStore;
      components: number[];
    }
  | ErrorResponse
  | RedirectResponse;

export function createRouter({ route, children }: Directory) {
  const app = new Hono();

  // middleware for loaders/actions
  app.use(async (c, next) => {
    const event = c.get("event");
    await event.runMiddleware(route.middleware);
    await next();
  });

  // middleware for running loader
  app.get(async (c, next) => {
    const event = c.get("event");
    await event.runLayer(route.layout);
    await next();
  });

  // middleware for running action
  app.post(async (c, next) => {
    const event = c.get("event");
    event.registerLayerActions(route.layout);
    await next();
  });

  // resolve to current route
  if (typeof route.index === "number") {
    app.get("/", async (c) => {
      const event = c.get("event");
      await event.runLayer(route.index);
      return await c.render(event.runtime);
    });

    app.get("/_data.json", async (c) => {
      const event = c.get("event");
      await event.runLayer(route.index);
      return c.json<LoaderResponse>({
        ok: "loader",
        meta: event.metas,
        params: event.params,
        loaders: event.loaders,
        components: event.components,
      });
    });

    app.post("/_data.json", async (c) => {
      const event = c.get("event");
      event.registerLayerActions(route.index);

      const ref = c.req.query("_action");
      if (!ref) {
        throw new HTTPException(400, {
          message: "No `_action` in search params",
        });
      }

      const action = event.findAction(ref);
      if (!action) {
        throw new HTTPException(400, {
          message: "Action not found",
        });
      }

      const res = await event.runAction(action);
      return c.json<ActionResponse>({
        ok: "action",
        action: res,
      });
    });
  }

  const catches = [] as [string, Directory][];
  const params = [] as [string, Directory][];
  const fakes = [] as [string, Directory][];
  const matches = [] as [string, Directory][];

  for (const [dirname, child] of children) {
    if (dirname === "[...]") {
      catches.push([dirname, child]);
    } else if (dirname.startsWith("[") && dirname.endsWith("]")) {
      params.push([dirname, child]);
    } else if (dirname.startsWith("(") && dirname.endsWith(")")) {
      fakes.push([dirname, child]);
    } else {
      matches.push([dirname, child]);
    }
  }

  for (const [dirname, child] of matches) {
    app.route(`/${dirname}/`, createRouter(child));
  }
  for (const [_, child] of fakes) {
    app.route("/", createRouter(child));
  }
  for (const [dirname, child] of params) {
    const name = dirname.slice(1, -1);
    app.route(`/:${name}/`, createRouter(child));
  }
  // FIXME: untested
  for (const [_, child] of catches) {
    app.route("/:_{^.+$}/", createRouter(child));
  }

  return app;
}
