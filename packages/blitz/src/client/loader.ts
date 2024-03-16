import { LoaderHandler, LoaderReturnValue } from "../server/loader.ts";
import { LoaderResponse } from "../server/router.ts";
import { useRuntime } from "./runtime.ts";
import { useMemo } from "preact/hooks";

export async function fetchLoaders(url: string | URL) {
  const target = new URL(url);
  if (!target.pathname.endsWith("/")) {
    target.pathname += "/";
  }
  target.hash = "";
  target.pathname += "_data.json";
  const response = await fetch(target);
  return (await response.json()) as LoaderResponse;
}

export function useLoader<T extends LoaderReturnValue>(
  ref: string,
): LoaderHandler<T> {
  const runtime = useRuntime();
  return useMemo(() => {
    const loaders = runtime.loaders.find((item) => item[0] === ref);
    if (!loaders) {
      throw new Error(`Loader not found: "${ref}"`);
    }
    return loaders[1] as T;
  }, [runtime]);
}
