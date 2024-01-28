import { VNode, render } from "preact";
import { Runtime, RuntimeContext } from "./runtime.ts";
import { SerializedRuntime } from "./components/router-head.tsx";
import { ClientManifest } from "../build/manifest.ts";

export type Options = {
  manifest: ClientManifest;
};

export async function hydrate(vnode: VNode, { manifest }: Options) {
  const runtime = await createClientRuntime(manifest);

  return render(
    <RuntimeContext.Provider value={runtime}>{vnode}</RuntimeContext.Provider>,
    document,
    document.documentElement,
  );
}

async function createClientRuntime(manifest: ClientManifest) {
  const element = document.querySelector("script[data-blitz-metadata]");
  if (!element || !element.textContent)
    throw new Error("Can't find SSR hydrate data");
  const json = JSON.parse(element.textContent) as SerializedRuntime;
  await manifest.preloadComponents(json.components);
  return new Runtime(
    manifest,
    new URL(json.url),
    new Map(json.loaders),
    json.components,
  );
}
