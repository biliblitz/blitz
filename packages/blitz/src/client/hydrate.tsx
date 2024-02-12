import { VNode, render } from "preact";
import { RuntimeProvider, createRuntime, runtimeLoad } from "./runtime.ts";
import { SerializedRuntime } from "./components/router-head.tsx";
import { ClientManifest } from "../server/build.ts";
import { isDev } from "../utils/envs.ts";

export type Options = {
  manifest: ClientManifest;
};

export async function hydrate(vnode: VNode, { manifest }: Options) {
  const runtime = await createClientRuntime(manifest);

  // fix for https://github.com/vitejs/vite/issues/15765
  let injections: NodeListOf<HTMLStyleElement> | null = null;
  if (isDev)
    injections = document.head.querySelectorAll("style[data-vite-dev-id]");

  render(
    <RuntimeProvider value={runtime}>{vnode}</RuntimeProvider>,
    document,
    document.documentElement,
  );

  if (isDev && injections)
    injections.forEach((element) => document.head.appendChild(element));
}

async function createClientRuntime(manifest: ClientManifest) {
  const element = document.querySelector("script[data-blitz-metadata]");
  if (!element || !element.textContent)
    throw new Error("Can't find SSR hydrate data");
  const json = JSON.parse(element.textContent) as SerializedRuntime;

  const runtime = createRuntime(
    json.meta,
    json.base,
    json.graph,
    json.params,
    json.loaders,
    manifest,
    new URL(location.href),
    json.components,
  );
  await runtimeLoad(runtime, json.components);

  return runtime;
}
