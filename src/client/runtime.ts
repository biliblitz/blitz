import { createContext } from "preact";
import { LoaderReturnValue } from "../server/loader.ts";
import { useContext } from "preact/hooks";
import { Signal, signal } from "@preact/signals";

export class Runtime {
  /** Current URL pathname */
  pathname: Signal<string> = signal("/");
  /** Current Loader data */
  loaders: Signal<[string, LoaderReturnValue][]> = signal([]);
  constructor() {}
}

export const RuntimeContext = createContext<Runtime | null>(null);

export function useRuntime() {
  const runtime = useContext(RuntimeContext);
  if (!runtime)
    throw new Error("Please nest your project inside <BlitzCityProvider />");
  return runtime;
}
