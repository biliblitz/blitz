import { FunctionComponent, createContext } from "preact";
import { useContext } from "preact/hooks";
import { ReadonlySignal, Signal, computed, signal } from "@preact/signals";
import { LoaderStore, LoaderStoreMap } from "../server/event.ts";
import { ClientManifest } from "../build/manifest.ts";
import { Graph } from "../build/graph.ts";

const unique = <T>(t: T[]) => Array.from(new Set(t));

export class Runtime {
  url: Signal<URL>;
  loaders: Signal<LoaderStore>;
  manifest: ClientManifest;
  components: Signal<number[]>;
  graph: Graph;
  preloads: Signal<number[]>;
  loadersMap: ReadonlySignal<LoaderStoreMap>;

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
    this.preloads = signal([...graph.entry]);
    this.loadersMap = computed(() => new Map(this.loaders.value));

    this.preload(components);
  }

  preload(components: number[]) {
    this.preloads.value = unique([
      ...this.preloads.value,
      ...components.flatMap((id) => this.graph.components[id]),
    ]);
  }

  async load(components: number[]) {
    await Promise.all(
      components
        .filter((id) => !this.manifest.components[id])
        .map(async (id) => {
          const path = "/" + this.graph.assets[this.graph.components[id][0]];
          const component = (await import(/* @vite-ignore */ path).then(
            (module) => module.default,
          )) as FunctionComponent;
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
