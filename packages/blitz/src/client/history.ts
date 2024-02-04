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

  useEffect(() => {
    // initialize
    replaceState({
      meta: runtime.meta.value,
      params: runtime.params.value,
      loaders: Array.from(runtime.loaders.value),
      position: [0, 0],
      components: runtime.components.value,
    });

    // add popstate callback
    addEventListener("popstate", async (e) => {
      const state = e.state as HistoryState;
      await render(state.meta, state.params, state.loaders, state.components);
      scrollTo(state.position[0], state.position[1]);
    });
  }, []);
}
