import { ReadonlySignal, batch, useComputed } from "@preact/signals";
import { LoaderStore } from "../server/event.ts";
import { pushState, replaceState, replaceURL } from "./history.ts";
import { runtimePreload, runtimeLoad, useRuntime } from "./runtime.ts";
import { lcp, nextTick } from "../utils/algorithms.ts";
import { LoaderResponse } from "../server/server.tsx";
import { Meta } from "../server/meta.ts";
import { Params } from "../server/router.ts";

export function useRender() {
  const runtime = useRuntime();

  return async (
    meta: Meta,
    params: Params,
    loaders: LoaderStore,
    components: number[],
  ) => {
    runtimePreload(runtime, components);
    await runtimeLoad(runtime, components);

    // FIXME: here we update the signal twice, which may cause some unexpected behavoir during updating.
    // However, this looks fine for me all the time.

    // remove old components
    runtime.components.value = lcp(runtime.components.value, components);

    // wait old components removed
    await nextTick();

    // trigger actual update
    batch(() => {
      runtime.meta.value = meta;
      runtime.params.value = params;
      runtime.loaders.value = loaders;
      runtime.location.value = new URL(location.href);
      runtime.components.value = components;
    });

    // then wait another tick for dom update finish
    await nextTick();
  };
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

export function useLocation(): ReadonlySignal<URL> {
  const runtime = useRuntime();
  return useComputed(() => new URL(runtime.location.value));
}
