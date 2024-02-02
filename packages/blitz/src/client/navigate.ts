import { ReadonlySignal, batch, useComputed } from "@preact/signals";
import { LoaderStore } from "../server/event.ts";
import { pushState, replaceState, replaceURL } from "./history.ts";
import { runtimePreload, runtimeLoad, useRuntime } from "./runtime.ts";
import { lcp, same } from "../utils/algorithms.ts";
import { LoaderResponse } from "../server/server.tsx";

export function useRender() {
  const runtime = useRuntime();

  return async (loaders: LoaderStore, components?: number[]) => {
    if (!components || same(runtime.components.value, components)) {
      runtime.loaders.value = loaders;
      return;
    }

    runtimePreload(runtime, components);
    await runtimeLoad(runtime, components);

    // FIXME: here we update the signal twice, which may cause some unexpected behavoir during updating.
    // However, this looks fine for me all the time.

    // remove old components
    runtime.components.value = lcp(runtime.components.value, components);

    // wait a tick
    await Promise.resolve();

    // trigger actual update
    batch(() => {
      runtime.loaders.value = loaders;
      runtime.components.value = components;
    });

    // then wait another tick for dom update finish
    await Promise.resolve();
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
      const targetAnchor = target.hash;
      const originAnchor = location.hash;

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
    const response = await fetch(dataUrl);
    const data = (await response.json()) as LoaderResponse;

    if (data.ok === "data") {
      replaceState({ position: [scrollX, scrollY] });
      pushState(
        {
          loaders: data.loaders,
          position: [0, 0],
          components: data.components,
        },
        target,
      );
      await render(data.loaders, data.components);
      if (target.hash) {
        document
          .getElementById(target.hash.slice(1))
          ?.scrollIntoView({ behavior: "smooth" });
      }
    } else if (data.ok === "redirect") {
      await navigate(data.redirect);
    }
  };
}

export function useLocation(): ReadonlySignal<URL> {
  const runtime = useRuntime();
  return useComputed(() => new URL(runtime.url.value));
}
