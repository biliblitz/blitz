import { VNode } from "preact";
import { RuntimeContext, createRuntime } from "../client/runtime.ts";
import { Handler } from "../node/index.ts";
import { ServerManifest } from "../build/manifest.ts";
import { resolveRouter } from "./router.ts";
import { createFetchEvent } from "./event.ts";

export type ServerOptions = {
  manifest: ServerManifest;
  render: (vnode: VNode, context?: any) => string;
};

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
      const loaders = await event.runLoaders();
      headers.set("Content-Type", "application/json");
      return new Response(
        JSON.stringify({
          ok: "data",
          store: loaders,
          components: event.components,
        }),
        { headers },
      );
    }

    const event = createFetchEvent(manifest, router, req, headers);
    const loaders = await event.runLoaders();
    const components = event.components;
    console.log(loaders, components);

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
