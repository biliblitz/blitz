import { LoaderStore } from "../server/event.ts";
import { pushState, replaceState, replaceURL } from "./history.ts";
import { Runtime, runtimeLoad, useRuntime } from "./runtime.ts";
import { unique } from "../utils/algorithms.ts";
import { Meta } from "../server/meta.ts";
import { Params } from "../server/router.ts";
import {
  Dispatch,
  StateUpdater,
  useCallback,
  useContext,
  useMemo,
} from "preact/hooks";
import { fetchLoaders } from "./loader.ts";
import { createContext } from "preact";

export type Render = (
  meta: Meta,
  params: Params,
  loaders: LoaderStore,
  components: number[],
) => Promise<void>;

export const RenderContext = createContext<Render | null>(null);

export function useRenderCallback(
  runtime: Runtime,
  setRuntime: Dispatch<StateUpdater<Runtime>>,
): Render {
  return useCallback(
    async (meta, params, loaders, components) => {
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
        components,
      }));
    },
    [runtime, setRuntime],
  );
}

export function useRender() {
  const render = useContext(RenderContext);
  if (!render)
    throw new Error("Please nest your project inside <BlitzCityProvider />");
  return render;
}

export type Navigate = (target: string | URL) => Promise<void>;

export const NavigateContext = createContext<Navigate | null>(null);

export function useNavigateCallback(render: Render): Navigate {
  return useCallback(
    async function navigate(target) {
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
    },
    [render],
  );
}

export function useNavigate() {
  const navigate = useContext(NavigateContext);
  if (!navigate)
    throw new Error("Please nest your project inside <BlitzCityProvider />");
  return navigate;
}

export function useLocation(): URL {
  const runtime = useRuntime();
  return useMemo(() => new URL(runtime.location), [runtime.location]);
}
