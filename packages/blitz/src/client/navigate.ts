import { batch } from "@preact/signals";
import { LoaderStore } from "../server/event.ts";
import { pushState, replaceState, replaceURL } from "./history.ts";
import { useRuntime } from "./runtime.ts";

export function useLocation() {
  const runtime = useRuntime();
  return new URL(runtime.url.value);
}

function longestCommonPrefix<T>(a: T[], b: T[]) {
  const c = [] as T[];
  for (let i = 0, len = Math.min(a.length, b.length); i < len; ++i)
    if (a[i] === b[i]) c.push(a[i]);
    else break;
  return c;
}

export function useRender() {
  const runtime = useRuntime();

  return async (components: number[], loaders: LoaderStore) => {
    runtime.preload(components);
    await runtime.load(components);

    // remove old components
    runtime.components.value = longestCommonPrefix(
      runtime.components.value,
      components,
    );

    // trigger actual update
    setTimeout(() => {
      batch(() => {
        runtime.loaders.value = loaders;
        runtime.components.value = components;
      });
    });
  };
}

export function useNavigate() {
  const runtime = useRuntime();
  const location = new URL(runtime.url.value);
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
    const data = await response.json();

    if (data.ok === "data") {
      replaceState({ position: [scrollX, scrollY] });
      pushState(
        {
          loaders: data.store,
          position: [0, 0],
          components: data.components,
        },
        target,
      );
      await render(data.components, data.store);
    } else if (data.ok === "redirect") {
      await navigate(data.redirect);
    }
  };
}
