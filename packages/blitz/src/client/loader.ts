import { LoaderHandler, LoaderReturnValue } from "../server/loader.ts";
import { useRuntime } from "./runtime.ts";
import { useMemo } from "preact/hooks";

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
