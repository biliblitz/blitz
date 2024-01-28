import { createContext } from "preact";
import { useContext } from "preact/hooks";
import { Signal, signal } from "@preact/signals";
import { LoaderStore } from "../server/event.ts";

export class Runtime {
  url: Signal<URL>;
  loaders: Signal<LoaderStore>;

  constructor(url: URL, loaders: LoaderStore) {
    this.url = signal(url);
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
