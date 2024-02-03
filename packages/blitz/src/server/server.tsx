import { VNode } from "preact";
import { render } from "preact-render-to-string";

import { RuntimeContext, createRuntime } from "../client/runtime.ts";
import { Handler } from "../node/index.ts";
import { ServerManifest } from "../build/manifest.ts";
import { ResolveResult, resolveRouter } from "./router.ts";
import { LoaderStore, createFetchEvent } from "./event.ts";
import { ActionReturnValue } from "./action.ts";

export type ServerOptions = {
  manifest: ServerManifest;
};

export type ActionResponse<T = ActionReturnValue> =
  | { ok: "data"; loaders: LoaderStore; components: number[]; action: T }
  | { ok: "error"; error: string }
  | { ok: "redirect"; redirect: string };

export type LoaderResponse =
  | { ok: "data"; loaders: LoaderStore; components: number[] }
  | { ok: "error"; error: string }
  | { ok: "redirect"; redirect: string };

export function createServer<T = void>(
  vnode: VNode,
  { manifest }: ServerOptions,
): Handler<T> {
  const router = resolveRouter(manifest.directory);

  return async (req) => {
    console.log(`ssr running for ${req.url}`);

    const url = new URL(req.url);

    if (url.pathname.endsWith("/_data.json")) {
      const resolve = router(url.pathname.slice(0, -10));
      if (resolve === null)
        return new Response("404 NOT FOUND", { status: 404 });

      const event = createFetchEvent(manifest, req, resolve);

      if (url.searchParams.has("_action")) {
        const ref = url.searchParams.get("_action")!;
        const action = await event.runAction(ref);
        const loaders = await event.runLoaders();
        event.headers.set("Content-Type", "application/json");
        return new Response(
          JSON.stringify({
            ok: "data",
            loaders: loaders,
            components: event.components,
            action: action,
          } as ActionResponse),
          { headers: event.headers },
        );
      }

      const loaders = await event.runLoaders();
      event.headers.set("Content-Type", "application/json");
      return new Response(
        JSON.stringify({
          ok: "data",
          loaders: loaders,
          components: event.components,
        } as LoaderResponse),
        { headers: event.headers },
      );
    }

    let resolve: ResolveResult | null = null;

    if (!url.pathname.endsWith("/")) {
      resolve = router(url.pathname + "/");
      if (resolve !== null) {
        const redirect = new URL(url);
        redirect.pathname += "/";
        return Response.redirect(redirect.href, 301);
      }
    } else {
      resolve = router(url.pathname);
    }

    if (resolve === null) {
      return new Response("404 NOT FOUND", { status: 404 });
    }

    const event = createFetchEvent(manifest, req, resolve);
    const loaders = await event.runLoaders();
    const components = event.components;

    const runtime = createRuntime(
      manifest,
      url,
      manifest.graph,
      loaders,
      components,
    );

    const html = render(
      <RuntimeContext.Provider value={runtime}>
        {vnode}
      </RuntimeContext.Provider>,
    );
    event.headers.set("Content-Type", "text/html");
    return new Response("<!DOCTYPE html>" + html, {
      headers: event.headers,
      status: event.status,
    });
  };
}
