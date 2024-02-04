import { ComponentType, createContext } from "preact";
import { useContext } from "preact/hooks";
import { Signal, signal } from "@preact/signals";
import { LoaderStore } from "../server/event.ts";
import { ClientManifest } from "../build/manifest.ts";
import { Graph } from "../build/graph.ts";
import { unique } from "../utils/algorithms.ts";
import { Meta } from "../server/meta.ts";
import { Params } from "../server/router.ts";

export type Runtime = {
  meta: Signal<Meta>;
  graph: Graph;
  params: Signal<Params>;
  loaders: Signal<LoaderStore>;
  manifest: ClientManifest;
  location: Signal<URL>;
  preloads: Signal<number[]>;
  components: Signal<number[]>;
};

export function createRuntime(
  manifest: ClientManifest,
  location: URL,
  meta: Meta,
  graph: Graph,
  params: Params,
  loaders: LoaderStore,
  components: number[],
): Runtime {
  const preloads = unique([
    ...graph.entry,
    ...components.flatMap((id) => graph.components[id]),
  ]);

  return {
    graph,
    manifest,
    meta: signal(meta),
    params: signal(params),
    loaders: signal(loaders),
    location: signal(location),
    preloads: signal(preloads),
    components: signal(components),
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
