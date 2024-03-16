import { LoaderStore } from "../server/event.ts";
import { pushState, replaceState, replaceURL } from "./history.ts";
import { runtimeLoad, useRuntime, useSetRuntime } from "./runtime.ts";
import { nextTick, unique } from "../utils/algorithms.ts";
import { Meta } from "../server/meta.ts";
import { Params } from "../server/router.ts";
import { useCallback, useMemo } from "preact/hooks";
import { fetchLoaders } from "./loader.ts";

export function useRender() {
  const runtime = useRuntime();
  const setRuntime = useSetRuntime();

  return useCallback(
    async (
      meta: Meta,
      params: Params,
      loaders: LoaderStore,
      components: number[],
    ) => {
      // preload components
      setRuntime((runtime) => ({
        ...runtime,
        preloads: unique([
          ...runtime.preloads,
          ...components.flatMap((id) => runtime.graph.components[id]),
        ]),
      }));

      // async load modules
      await runtimeLoad(runtime, components);

      // apply new values
      setRuntime((runtime) => ({
        ...runtime,
        meta,
        params,
        loaders,
        location: new URL(location.href),
        components,
      }));

      // then wait another tick for dom update finish
      await nextTick();
    },
    [runtime, setRuntime],
  );
}

export function useNavigate() {
  const render = useRender();

  return async function navigate(target: string | URL) {
    if (typeof target === "string") {
      target = new URL(target, location.href);
    }

    if (target.host !== location.host) {
      open(target);
      return;
    }

    if (
      target.pathname === location.pathname &&
      target.search === location.search
    ) {
      const targetAnchor = decodeURIComponent(target.hash);
      const originAnchor = decodeURIComponent(location.hash);

      // check if is hash update
      if (targetAnchor !== originAnchor && targetAnchor) {
        document
          .getElementById(targetAnchor.slice(1))
          ?.scrollIntoView({ behavior: "smooth" });
        replaceURL(target);
        return;
      }

      // then there is nothing to do
      return;
    }

    // fix pathname
    if (!target.pathname.endsWith("/")) {
      target.pathname += "/";
    }

    try {
      const resp = await fetchLoaders(target);

      if (resp.ok === "loader") {
        replaceState({ position: [scrollX, scrollY] });
        pushState(
          {
            meta: resp.meta,
            params: resp.params,
            loaders: resp.loaders,
            position: [0, 0],
            components: resp.components,
          },
          target,
        );
        await render(resp.meta, resp.params, resp.loaders, resp.components);
        if (target.hash) {
          document
            .getElementById(decodeURIComponent(target.hash.slice(1)))
            ?.scrollIntoView({ behavior: "smooth" });
        } else {
          scrollTo(0, 0);
        }
      } else if (resp.ok === "redirect") {
        await navigate(resp.redirect);
      } else if (resp.ok === "error") {
        throw new Error(resp.error);
      } else {
        throw new Error(`Invalid Response`);
      }
    } catch (e) {
      console.error(`Failed to navigate to ${target.href}`);
      console.error(e);
    }
  };
}

export function useLocation(): URL {
  const runtime = useRuntime();
  return useMemo(() => new URL(runtime.location), [runtime]);
}
