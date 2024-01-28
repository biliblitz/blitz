import { createContext } from "preact";
import { useContext } from "preact/hooks";
import { Signal, signal } from "@preact/signals";
import { LoaderStore } from "../server/event.ts";
import { ClientManifest } from "../build/manifest.ts";

export class Runtime {
  url: Signal<URL>;
  loaders: Signal<LoaderStore>;
  manifest: ClientManifest;
  components: Signal<number[]>;

  constructor(
    manifest: ClientManifest,
    url: URL,
    loaders: LoaderStore,
    components: number[],
  ) {
    this.url = signal(url);
    this.loaders = signal(loaders);
    this.manifest = manifest;
    this.components = signal(components);
  }
}

export const RuntimeContext = createContext<Runtime | null>(null);

export function useRuntime() {
  const runtime = useContext(RuntimeContext);
  if (!runtime)
    throw new Error("Please nest your project inside <BlitzCityProvider />");
  return runtime;
}
