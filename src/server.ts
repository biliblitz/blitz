import { VNode } from "preact";
import { render } from "preact-render-to-string";

export type Handler<T> = (req: Request, t?: T) => Promise<Response>;

export function createServer<T = void>(vnode: VNode): Handler<T> {
  return async (req) => {
    console.log(`ssr running for ${req.url}`);

    const headers = new Headers();
    const html = render(vnode);

    headers.set("content-type", "text/html");
    return new Response("<!DOCTYPE html>" + html, { headers });
  };
}
