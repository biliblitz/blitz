import { createContext } from "preact";
import { LoaderReturnValue } from "../server/loader.ts";
import { useContext } from "preact/hooks";
import { Signal, signal } from "@preact/signals";

export class Runtime {
  pathname: Signal<string>;
  loaders: Signal<[string, LoaderReturnValue][]>;

  constructor(pathname: string, loaders: [string, LoaderReturnValue][]) {
    this.pathname = signal(pathname);
    this.loaders = signal(loaders);
  }
}

export const RuntimeContext = createContext<Runtime | null>(null);

export function useRuntime() {
  const runtime = useContext(RuntimeContext);
  if (!runtime)
    throw new Error("Please nest your project inside <BlitzCityProvider />");
  return runtime;
}
