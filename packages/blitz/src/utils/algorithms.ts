import type { LoaderStore } from "../server/router.ts";

/** unique array */
export const unique = <T>(t: T[]) => Array.from(new Set(t));

export function mergeLoaderStore(a: LoaderStore, b: LoaderStore) {
  return Array.from(new Map([...a, ...b]));
}
