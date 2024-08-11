import { Hono } from "hono";
import type { Directory } from "./types.ts";
import type { ActionReturnValue } from "./action.ts";
import type { LoaderReturnValue } from "./loader.ts";
import { HTTPException } from "hono/http-exception";

export type Params = [string, string][];
export type LoaderStore = [string, LoaderReturnValue][];

export type ErrorResponse = { ok: "error"; error: string; status: number };
export type RedirectResponse = { ok: "redirect"; redirect: string };

export type ActionResponse<T = ActionReturnValue> =
  | { ok: "action"; action: T }
  | ErrorResponse
  | RedirectResponse;

export type LoaderResponse =
  | { ok: "loader"; loaders: LoaderStore }
  | ErrorResponse
  | RedirectResponse;

export function createHonoRouter({ route, children }: Directory) {
  const app = new Hono();

  // add layer
  if (route.layout != null) {
    const layout = route.layout;

    // middleware for loaders/actions
    app.use(async (c, next) => {
      const event = c.get("event");
      event.registerActions(layout);
      await event.runMiddleware(layout, next);
    });

    // middleware for running loader, meta and components
    app.get(async (c, next) => {
      const event = c.get("event");
      await event.runLayer(layout);
      await next();
    });
  }

  // resolve to current route
  if (route.index != null) {
    const index = route.index;

    app.on(
      ["GET", "POST", "DELETE", "PUT", "PATCH"],
      ["/", "/_data.json"],
      async (c, next) => {
        const event = c.get("event");
        await event.runMiddleware(index, next);
      },
    );

    app.get("/", async (c) => {
      const event = c.get("event");
      await event.runLayer(index);
      return await c.render(event.runtime);
    });

    app.get("/_data.json", async (c) => {
      const event = c.get("event");
      await event.runLayer(index);
      return c.json<LoaderResponse>({
        ok: "loader",
        loaders: event.loaders,
      });
    });

    app.on(["POST", "DELETE", "PUT", "PATCH"], "/_data.json", async (c) => {
      const event = c.get("event");
      event.registerActions(index);

      const ref = c.req.query("_action");
      if (!ref) {
        throw new HTTPException(400, {
          message: "No `?_action` query in search params",
        });
      }

      const action = event.findAction(ref);
      if (!action) {
        throw new HTTPException(400, {
          message: "Action not found",
        });
      }

      if (c.req.method !== action._mthd) {
        throw new HTTPException(405, {
          message: `Method not allowed, should use ${action._mthd}`,
        });
      }

      const res = await event.runAction(action);
      return c.json<ActionResponse>({ ok: "action", action: res });
    });
  }

  const fakes = [] as [string, Directory][];
  const params = [] as [string, Directory][];
  const catches = [] as [string, Directory][];
  const matches = [] as [string, Directory][];

  for (const [dirname, child] of children) {
    if (dirname.startsWith("[[") && dirname.endsWith("]]")) {
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
    app.route(`/${dirname}/`, createHonoRouter(child));
  }
  for (const [_, child] of fakes) {
    app.route("/", createHonoRouter(child));
  }
  for (const [dirname, child] of params) {
    const name = dirname.slice(1, -1);
    app.route(`/:${name}/`, createHonoRouter(child));
  }
  // TODO: I can't make hono work.
  for (const [dirname, child] of catches) {
    // console.warn("using catch-all route is not supported right now");
    const name = dirname.slice(2, -2);
    app.route(`/:${name}{.+}/`, createHonoRouter(child));
  }

  return app;
}
