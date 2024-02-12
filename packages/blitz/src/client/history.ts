import { useEffect } from "preact/hooks";
import { LoaderStore } from "../server/event.ts";
import { useRender } from "./navigate.ts";
import { useRuntime } from "./runtime.ts";
import { Meta } from "../server/meta.ts";
import { Params } from "../server/router.ts";

/**
 * 古希腊掌管历史记录的神
 */
export type HistoryState = {
  meta: Meta;
  params: Params;
  loaders: LoaderStore;
  position: [number, number];
  components: number[];
};

export function replaceState(state: Partial<HistoryState>) {
  history.replaceState({ ...history.state, ...state }, "");
}

export function replaceURL(url: string | URL) {
  history.replaceState(history.state, "", url);
}

export function pushState(state: HistoryState, url: string | URL) {
  history.pushState(state, "", url);
}

export function useHistoryRestore() {
  const runtime = useRuntime();
  const render = useRender();

  // listen runtime update
  useEffect(() => {
    replaceState({
      meta: runtime.meta,
      params: runtime.params,
      loaders: runtime.loaders,
      position: [scrollX, scrollY],
      components: runtime.components,
    });
  }, [runtime]);

  // add popstate callback
  useEffect(() => {
    async function popstate(e: PopStateEvent) {
      const state = e.state as HistoryState;
      await render(state.meta, state.params, state.loaders, state.components);
      scrollTo(state.position[0], state.position[1]);
    }

    function scroll() {
      replaceState({ position: [scrollX, scrollY] });
    }

    addEventListener("popstate", popstate);
    addEventListener("scroll", scroll);

    return () => {
      removeEventListener("popstate", popstate);
      removeEventListener("scroll", scroll);
    };
  }, []);
}
