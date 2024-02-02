import { ComponentType, createContext } from "preact";
import { useContext } from "preact/hooks";
import { ReadonlySignal, Signal, computed, signal } from "@preact/signals";
import { LoaderStore, LoaderStoreMap } from "../server/event.ts";
import { ClientManifest } from "../build/manifest.ts";
import { Graph } from "../build/graph.ts";
import { unique } from "../utils/algorithms.ts";

export type Runtime = {
  url: Signal<URL>;
  loaders: Signal<LoaderStore>;
  manifest: ClientManifest;
  components: Signal<number[]>;
  graph: Graph;
  preloads: Signal<number[]>;
  loadersMap: ReadonlySignal<LoaderStoreMap>;
};

export function createRuntime(
  manifest: ClientManifest,
  graph: Graph,
  url: URL,
  loaders: LoaderStore,
  components: number[],
): Runtime {
  const url$ = signal(url);
  const loaders$ = signal(loaders);
  const components$ = signal(components);
  const preloads = signal(
    unique([
      ...graph.entry,
      ...components.flatMap((id) => graph.components[id]),
    ]),
  );
  const loadersMap = computed(() => new Map(loaders$.value));

  return {
    url: url$,
    loaders: loaders$,
    manifest,
    components: components$,
    graph,
    preloads,
    loadersMap,
  };
}

export function runtimePreload(runtime: Runtime, components: number[]) {
  runtime.preloads.value = unique([
    ...runtime.preloads.value,
    ...components.flatMap((id) => runtime.graph.components[id]),
  ]);
}

export async function runtimeLoad(runtime: Runtime, components: number[]) {
  await Promise.all(
    components
      .filter((id) => !runtime.manifest.components[id])
      .map(async (id) => {
        const path =
          "/" + runtime.graph.assets[runtime.graph.components[id][0]];
        const component = (await import(/* @vite-ignore */ path).then(
          (module) => module.default,
        )) as ComponentType;
        runtime.manifest.components[id] = component;
      }),
  );
}

export const RuntimeContext = createContext<Runtime | null>(null);

export function useRuntime() {
  const runtime = useContext(RuntimeContext);
  if (!runtime)
    throw new Error("Please nest your project inside <BlitzCityProvider />");
  return runtime;
}
