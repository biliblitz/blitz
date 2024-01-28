import { VNode } from "preact";
import { Runtime, RuntimeContext } from "../client/runtime.ts";
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

    const event = createFetchEvent(manifest, router, req, headers);
    const loaders = await event.runLoaders();
    const components = event.components;
    console.log(loaders, components);

    const runtime = new Runtime(manifest, url, loaders, components);

    try {
      console.log("start render");
      const html = render(
        <RuntimeContext.Provider value={runtime}>
          {vnode}
        </RuntimeContext.Provider>,
      );
      console.log("end render");
      headers.set("Content-Type", "text/html");
      return new Response("<!DOCTYPE html>" + html, { headers });
    } catch (e) {
      console.error(e);
      throw e;
    }
  };
}
