import { useComputed } from "@preact/signals";
import { LoaderHandler, LoaderReturnValue } from "../server/loader.ts";
import { useRuntime } from "./runtime.ts";

export function useLoader<T extends LoaderReturnValue>(
  ref: string,
): LoaderHandler<T> {
  const runtime = useRuntime();
  return useComputed(() => {
    const loaders = runtime.loaders.value;
    if (!loaders.has(ref)) {
      throw new Error(`Loader not found: ${ref}`);
    }
    return runtime.loaders.value.get(ref) as T;
  });
}
