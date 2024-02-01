import { LoaderStore } from "../server/event.ts";

/**
 * 古希腊掌管历史记录的神
 */
export type HistoryState = {
  stores: LoaderStore;
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
