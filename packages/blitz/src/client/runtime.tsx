import {
  type ComponentChildren,
  type ComponentType,
  createContext,
} from "preact";
import { useContext, useState } from "preact/hooks";
import type { FetchEvent, LoaderStore } from "../server/event.ts";
import type { ClientManifest, Graph, ServerManifest } from "../server/build.ts";
import { unique } from "../utils/algorithms.ts";
import type { Meta } from "../server/meta.ts";
import type { Params } from "../server/router.ts";
import {
  NavigateContext,
  RenderContext,
  useNavigateCallback,
  useRenderCallback,
} from "./navigate.ts";

export type Runtime = {
  meta: Meta;
  params: Params;
  loaders: LoaderStore;
  location: URL;
  preloads: number[];
  components: number[];
};

export type RuntimeStatic = {
  base: string;
  graph: Graph;
  manifest: ClientManifest;
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
): [Runtime, RuntimeStatic] {
  const preloads = unique([
    ...graph.entry,
    ...components.flatMap((id) => graph.components[id]),
  ]);

  return [
    { meta, params, loaders, location, preloads, components },
    { base, graph, manifest },
  ];
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

export async function runtimeLoad(
  runtime: RuntimeStatic,
  components: number[],
) {
  await Promise.all(
    components
      .filter((id) => !(id in runtime.manifest.components))
      .map(async (id) => {
        const path =
          runtime.base + runtime.graph.assets[runtime.graph.components[id][0]];
        const module = await import(/* @vite-ignore */ path);
        runtime.manifest.components[id] =
          module.default as ComponentType | null;
      }),
  );
}

export const RuntimeContext = createContext<Runtime | null>(null);
export const RuntimeStaticContext = createContext<RuntimeStatic | null>(null);

export function RuntimeProvider(props: {
  value: [Runtime, RuntimeStatic];
  children: ComponentChildren;
}) {
  const [_runtime, runtimeStatic] = props.value;
  const [runtime, setRuntime] = useState(_runtime);
  const render = useRenderCallback(runtimeStatic, setRuntime);
  const navigate = useNavigateCallback(render, runtimeStatic);

  return (
    <RuntimeContext.Provider value={runtime}>
      <RuntimeStaticContext.Provider value={runtimeStatic}>
        <RenderContext.Provider value={render}>
          <NavigateContext.Provider value={navigate}>
            {props.children}
          </NavigateContext.Provider>
        </RenderContext.Provider>
      </RuntimeStaticContext.Provider>
    </RuntimeContext.Provider>
  );
}

export function useRuntime() {
  const runtime = useContext(RuntimeContext);
  if (!runtime)
    throw new Error("Please nest your project inside <BlitzCityProvider />");
  return runtime;
}

export function useRuntimeStatic() {
  const runtime = useContext(RuntimeStaticContext);
  if (!runtime)
    throw new Error("Please nest your project inside <BlitzCityProvider />");
  return runtime;
}
