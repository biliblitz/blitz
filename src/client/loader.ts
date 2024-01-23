import { useComputed } from "@preact/signals";
import { LoaderHandler, LoaderReturnValue } from "../server/loader.ts";
import { useRuntime } from "./runtime.ts";

export function useLoader<T extends LoaderReturnValue>(
  ref: string,
): LoaderHandler<T> {
  const runtime = useRuntime();
  return useComputed(() => {
    const data = runtime.loaders.value.find(([name]) => name === ref);
    if (!data) throw new Error(`Loader not found: ${ref}`);
    return data[1] as T;
  });
}
