import { computed } from "vue";
import type { LoaderHandler, LoaderReturnValue } from "../server/loader.ts";
import type { LoaderResponse } from "../server/router.ts";
import { useLoaders } from "./runtime.ts";

export async function fetchLoaders(url: string | URL) {
  const target = new URL(url);
  target.hash = "";
  if (target.pathname.endsWith("/")) {
    target.pathname += "_data.json";
  } else {
    target.pathname += "/_data.json";
  }
  const response = await fetch(target);
  return (await response.json()) as LoaderResponse;
}

export function useLoader<T extends LoaderReturnValue>(
  ref: string,
): LoaderHandler<T> {
  const store = useLoaders();
  return computed(() => {
    if (!store.value.has(ref)) {
      throw new Error(`Loader not found: "${ref}"`);
    } else {
      return store.value.get(ref) as T;
    }
  });
}
