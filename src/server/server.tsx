import { VNode } from "preact";
import { Runtime, RuntimeContext } from "../client/runtime.ts";
import { render } from "preact-render-to-string";
import { Handler } from "../node/index.ts";

export function createServer<T = void>(vnode: VNode): Handler<T> {
  return async (req) => {
    console.log(`ssr running for ${req.url}`);
    const url = new URL(req.url);

    const headers = new Headers();
    const pathname = url.pathname;
    const loaders = [] as never[];
    const runtime = new Runtime(pathname, loaders);

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
