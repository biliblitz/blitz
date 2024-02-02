import { VNode, render } from "preact";
import { RuntimeContext, createRuntime, runtimeLoad } from "./runtime.ts";
import { SerializedRuntime } from "./components/router-head.tsx";
import { ClientManifest } from "../build/manifest.ts";

export type Options = {
  manifest: ClientManifest;
};

export async function hydrate(vnode: VNode, { manifest }: Options) {
  const runtime = await createClientRuntime(manifest);

  // fix for https://github.com/vitejs/vite/issues/15765
  let injections: NodeListOf<HTMLStyleElement> | null = null;
  if (import.meta.env.DEV)
    injections = document.head.querySelectorAll("style[data-vite-dev-id]");

  render(
    <RuntimeContext.Provider value={runtime}>{vnode}</RuntimeContext.Provider>,
    document,
    document.documentElement,
  );

  if (import.meta.env.DEV && injections)
    injections.forEach((element) => document.head.appendChild(element));
}

async function createClientRuntime(manifest: ClientManifest) {
  const element = document.querySelector("script[data-blitz-metadata]");
  if (!element || !element.textContent)
    throw new Error("Can't find SSR hydrate data");
  const json = JSON.parse(element.textContent) as SerializedRuntime;

  const runtime = createRuntime(
    manifest,
    json.graph,
    new URL(json.url),
    json.loaders,
    json.components,
  );
  await runtimeLoad(runtime, json.components);

  return runtime;
}
