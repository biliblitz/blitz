import { ComponentChildren, ComponentType, createContext } from "preact";
import { useContext, useState } from "preact/hooks";
import { FetchEvent, LoaderStore } from "../server/event.ts";
import { ClientManifest, Graph, ServerManifest } from "../server/build.ts";
import { unique } from "../utils/algorithms.ts";
import { Meta } from "../server/meta.ts";
import { Params } from "../server/router.ts";
import {
  NavigateContext,
  RenderContext,
  useNavigateCallback,
  useRenderCallback,
} from "./navigate.ts";

export type Runtime = {
  meta: Meta;
  base: string;
  graph: Graph;
  params: Params;
  loaders: LoaderStore;
  manifest: ClientManifest;
  location: URL;
  preloads: number[];
  components: number[];
};

export function createRuntime(
  meta: Meta,
  base: string,
  graph: Graph,
  params: Params,
  loaders: LoaderStore,
  manifest: ClientManifest,
  location: URL,
  components: number[],
): Runtime {
  const preloads = unique([
    ...graph.entry,
    ...components.flatMap((id) => graph.components[id]),
  ]);

  return {
    meta,
    base,
    graph,
    params,
    loaders,
    manifest,
    location,
    preloads,
    components,
  };
}

export function createServerRuntime(
  manifest: ServerManifest,
  event: FetchEvent,
) {
  return createRuntime(
    event.metas,
    manifest.base,
    manifest.graph,
    event.params,
    event.loaders,
    manifest,
    event.url,
    event.components,
  );
}

export async function runtimeLoad(runtime: Runtime, components: number[]) {
  const { manifest, graph, base } = runtime;
  await Promise.all(
    components
      .filter((id) => !manifest.components[id])
      .map(async (id) => {
        const path = base + graph.assets[graph.components[id][0]];
        const component = (await import(/* @vite-ignore */ path).then(
          (module) => module.default,
        )) as ComponentType;
        manifest.components[id] = component;
      }),
  );
}

export const RuntimeContext = createContext<Runtime | null>(null);

export function RuntimeProvider(props: {
  value: Runtime;
  children: ComponentChildren;
}) {
  const [runtime, setRuntime] = useState(props.value);
  const render = useRenderCallback(runtime, setRuntime);
  const navigate = useNavigateCallback(render);

  return (
    <RuntimeContext.Provider value={runtime}>
      <RenderContext.Provider value={render}>
        <NavigateContext.Provider value={navigate}>
          {props.children}
        </NavigateContext.Provider>
      </RenderContext.Provider>
    </RuntimeContext.Provider>
  );
}

export function useRuntime() {
  const runtime = useContext(RuntimeContext);
  if (!runtime)
    throw new Error("Please nest your project inside <BlitzCityProvider />");
  return runtime;
}
