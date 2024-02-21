import { useMemo } from "preact/hooks";
import { useRuntime } from "./runtime.tsx";

export function useParam(param: string) {
  const runtime = useRuntime();
  return useMemo(() => {
    return runtime.params.find(([ref, _]) => ref === param)?.[1] || "";
  }, [runtime.params]);
}

export function useCatchParam() {
  return useParam("$");
}
