import { VNode } from "preact";
import { RuntimeContext, createRuntime } from "../client/runtime.ts";
import { Handler } from "../node/index.ts";
import { ServerManifest } from "../build/manifest.ts";
import { resolveRouter } from "./router.ts";
import { LoaderStore, createFetchEvent } from "./event.ts";
import { ActionReturnValue } from "./action.ts";

export type ServerOptions = {
  manifest: ServerManifest;
  render: (vnode: VNode, context?: any) => string;
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
  { manifest, render }: ServerOptions,
): Handler<T> {
  const router = resolveRouter(manifest.directory);

  return async (req) => {
    console.log(`ssr running for ${req.url}`);

    const url = new URL(req.url);
    const headers = new Headers();

    if (url.pathname.endsWith("/_data.json")) {
      const event = createFetchEvent(
        manifest,
        router,
        req,
        headers,
        url.pathname.slice(0, -10),
      );

      if (url.searchParams.has("_action")) {
        const ref = url.searchParams.get("_action")!;
        const action = await event.runAction(ref);
        const loaders = await event.runLoaders();
        headers.set("Content-Type", "application/json");
        return new Response(
          JSON.stringify({
            ok: "data",
            loaders: loaders,
            components: event.components,
            action: action,
          } as ActionResponse),
          { headers },
        );
      }

      const loaders = await event.runLoaders();
      headers.set("Content-Type", "application/json");
      return new Response(
        JSON.stringify({
          ok: "data",
          loaders: loaders,
          components: event.components,
        } as LoaderResponse),
        { headers },
      );
    }

    const event = createFetchEvent(manifest, router, req, headers);
    const loaders = await event.runLoaders();
    const components = event.components;

    const runtime = createRuntime(
      manifest,
      manifest.graph,
      url,
      loaders,
      components,
    );

    try {
      const html = render(
        <RuntimeContext.Provider value={runtime}>
          {vnode}
        </RuntimeContext.Provider>,
      );
      headers.set("Content-Type", "text/html");
      return new Response("<!DOCTYPE html>" + html, { headers });
    } catch (e) {
      console.error(e);
      throw e;
    }
  };
}
