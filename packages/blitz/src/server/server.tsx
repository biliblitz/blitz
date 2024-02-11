import { VNode } from "preact";
import { render } from "preact-render-to-string";

import { RuntimeProvider, createRuntime } from "../client/runtime.ts";
import { ServerManifest } from "./build.ts";
import { Params, ResolveResult, resolveRouter } from "./router.ts";
import { LoaderStore, createFetchEvent } from "./event.ts";
import { ActionReturnValue } from "./action.ts";
import { Meta } from "./meta.ts";

export type Server<T> = (req: Request, t?: T) => Promise<Response>;

export type ServerOptions = {
  manifest: ServerManifest;
};

export type ErrorResponse = { ok: "error"; error: string };
export type RedirectResponse = { ok: "redirect"; redirect: string };

export type ActionResponse<T = ActionReturnValue> =
  | {
      ok: "action";
      meta: Meta;
      params: Params;
      loaders: LoaderStore;
      components: number[];
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

export function createServer<T = void>(
  vnode: VNode,
  { manifest }: ServerOptions,
): Server<T> {
  const router = resolveRouter(manifest.directory);

  return async (req) => {
    // console.log(`ssr running for ${req.url}`);

    const url = new URL(req.url);

    if (url.pathname.endsWith("/_data.json")) {
      const resolve = router(url.pathname.slice(0, -10));
      if (resolve === null)
        return new Response("404 NOT FOUND", { status: 404 });

      const event = createFetchEvent(manifest, req, resolve);

      try {
        if (url.searchParams.has("_action")) {
          const ref = url.searchParams.get("_action")!;

          const action = await event.runAction(ref);
          const loaders = await event.runLoaders();
          const meta = await event.runMetas();
          event.headers.set("Content-Type", "application/json");
          return new Response(
            JSON.stringify({
              ok: "action",
              meta: meta,
              params: resolve.params,
              action: action,
              loaders: loaders,
              components: event.components,
            } satisfies ActionResponse),
            { headers: event.headers },
          );
        }

        const loaders = await event.runLoaders();
        const meta = await event.runMetas();
        event.headers.set("Content-Type", "application/json");
        return new Response(
          JSON.stringify({
            ok: "loader",
            meta: meta,
            params: resolve.params,
            loaders: loaders,
            components: event.components,
          } satisfies LoaderResponse),
          { headers: event.headers },
        );
      } catch (e) {
        if (e instanceof URL) {
          event.headers.set("Content-Type", "application/json");
          return new Response(
            JSON.stringify({
              ok: "redirect",
              redirect: e.href,
            } satisfies RedirectResponse),
            { headers: event.headers },
          );
        }

        const errorMessage = e instanceof Error ? e.message : String(e);
        event.headers.set("Content-Type", "application/json");
        return new Response(
          JSON.stringify({
            ok: "error",
            error: errorMessage,
          } satisfies ErrorResponse),
          { headers: event.headers },
        );
      }
    }

    let resolve: ResolveResult | null = null;

    if (!url.pathname.endsWith("/") || url.pathname.includes("//")) {
      let pathname = url.pathname;

      if (!pathname.endsWith("/")) {
        pathname += "/";
      }
      while (pathname.includes("//")) {
        pathname = pathname.replaceAll("//", "/");
      }

      resolve = router(pathname);

      if (resolve !== null) {
        const redirect = new URL(url);
        redirect.pathname = pathname;
        return Response.redirect(redirect.href, 301);
      }
    } else {
      resolve = router(url.pathname);
    }

    if (resolve === null) {
      // TODO: error render
      return new Response("404 NOT FOUND", { status: 404 });
    }

    const event = createFetchEvent(manifest, req, resolve);

    try {
      const loaders = await event.runLoaders();
      const meta = await event.runMetas();
      const components = event.components;

      const runtime = createRuntime(
        meta,
        manifest.graph,
        resolve.params,
        loaders,
        manifest,
        url,
        components,
      );

      const html = render(
        <RuntimeProvider value={runtime}>{vnode}</RuntimeProvider>,
      );
      event.headers.set("Content-Type", "text/html");
      return new Response("<!DOCTYPE html>" + html, {
        status: event.status,
        headers: event.headers,
      });
    } catch (e) {
      if (e instanceof URL) {
        event.headers.set("Location", e.href);
        return new Response(null, { status: 302, headers: event.headers });
      }

      if (e instanceof Response) {
        return e;
      }

      const error = e instanceof Error ? e : new Error(String(e));
      console.log(error);
      // TODO: error render
      return new Response(error.message, {
        status: 500,
        headers: event.headers,
      });
    }
  };
}
