import { LoaderStore } from "../server/event.ts";
import { pushState, replaceState, replaceURL } from "./history.ts";
import { runtimeLoad, useRuntime, useSetRuntime } from "./runtime.ts";
import { nextTick, unique } from "../utils/algorithms.ts";
import { LoaderResponse } from "../server/router.ts";
import { Meta } from "../server/meta.ts";
import { Params } from "../server/router.ts";
import { useCallback, useMemo } from "preact/hooks";

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

    if (target.pathname === location.pathname) {
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

    const dataUrl = new URL(target);
    dataUrl.pathname += "_data.json";

    try {
      const response = await fetch(dataUrl);
      const data = (await response.json()) as LoaderResponse;

      if (data.ok === "loader") {
        replaceState({ position: [scrollX, scrollY] });
        pushState(
          {
            meta: data.meta,
            params: data.params,
            loaders: data.loaders,
            position: [0, 0],
            components: data.components,
          },
          target,
        );
        await render(data.meta, data.params, data.loaders, data.components);
        if (target.hash) {
          document
            .getElementById(target.hash.slice(1))
            ?.scrollIntoView({ behavior: "smooth" });
        } else {
          scrollTo(0, 0);
        }
      } else if (data.ok === "redirect") {
        await navigate(data.redirect);
      } else if (data.ok === "error") {
        throw new Error(data.error);
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
