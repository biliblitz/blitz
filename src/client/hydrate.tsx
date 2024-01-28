import { VNode, render } from "preact";
import { Runtime, RuntimeContext } from "./runtime.ts";
import { SerializedRuntime } from "./components/router-head.tsx";
import { ClientManifest } from "../build/manifest.ts";

export type Options = {
  manifest: ClientManifest;
};

export function hydrate(vnode: VNode, { manifest }: Options) {
  const runtime = createClientRuntime(manifest);

  return render(
    <RuntimeContext.Provider value={runtime}>{vnode}</RuntimeContext.Provider>,
    document,
    document.documentElement,
  );
}

function createClientRuntime(manifest: ClientManifest) {
  const element = document.querySelector("script[data-blitz-metadata]");
  if (!element || !element.textContent)
    throw new Error("Can't find SSR hydrate data");
  const json = JSON.parse(element.textContent) as SerializedRuntime;
  return new Runtime(
    manifest,
    new URL(json.url),
    new Map(json.loaders),
    json.components,
  );
}
