import { createContext } from "preact";
import { useContext } from "preact/hooks";
import { Signal, signal } from "@preact/signals";
import { LoaderStore } from "../server/event.ts";
import { ClientManifest } from "../build/manifest.ts";
import { Graph } from "../build/graph.ts";

export class Runtime {
  url: Signal<URL>;
  loaders: Signal<LoaderStore>;
  manifest: ClientManifest;
  components: Signal<number[]>;
  graph: Graph;
  preloads: Signal<number[]>;

  constructor(
    manifest: ClientManifest,
    url: URL,
    loaders: LoaderStore,
    components: number[],
    graph: Graph,
  ) {
    this.url = signal(url);
    this.loaders = signal(loaders);
    this.manifest = manifest;
    this.components = signal(components);
    this.graph = graph;
    this.preloads = signal([]);
    this.preload(components);
  }

  preload(components: number[]) {
    // trigger preloads
    this.preloads.value = Array.from(
      new Set([
        ...this.preloads.value,
        ...components.flatMap((id) => this.graph.components[id]),
      ]),
    );
  }

  async load(components: number[]) {
    await Promise.all(
      components
        .filter((id) => !this.manifest.components[id])
        .map(async (id) => {
          const path = "/" + this.graph.assets[this.graph.components[id][0]];
          const component = await import(/* @vite-ignore */ path).then(
            (module) => module.default,
          );
          this.manifest.components[id] = component;
        }),
    );
  }
}

export const RuntimeContext = createContext<Runtime | null>(null);

export function useRuntime() {
  const runtime = useContext(RuntimeContext);
  if (!runtime)
    throw new Error("Please nest your project inside <BlitzCityProvider />");
  return runtime;
}
