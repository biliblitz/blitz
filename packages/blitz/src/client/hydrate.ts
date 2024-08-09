import {
  createRuntime,
  MANIFEST_SYMBOL,
  RUNTIME_SYMBOL,
  type Runtime,
} from "./runtime.ts";
import type { ClientManifest, Graph } from "../server/types.ts";
import { createApp, ref, type Component } from "vue";
import { createHead } from "@unhead/vue";
import { createRouter, createWebHistory } from "vue-router";
import type { SerializedRuntime } from "./provider.ts";

export type Options = {
  manifest: ClientManifest;
};

export function hydrate(root: Component, { manifest }: Options) {
  const [runtime, graph] = createClientRuntime();

  const head = createHead();
  const router = createRouter({
    routes: manifest.routes,
    history: createWebHistory(manifest.base),
  });

  createApp(root)
    .use(head)
    .use(router)
    .provide(RUNTIME_SYMBOL, ref(runtime))
    .provide(MANIFEST_SYMBOL, { ...manifest, ...graph })
    .mount("#app", true);
}

function createClientRuntime(): [Runtime, Graph] {
  const element = document.querySelector("script[data-blitz=metadata]");
  if (!element || !element.textContent)
    throw new Error("Can't find SSR hydrate data");

  const json = JSON.parse(element.textContent) as SerializedRuntime;

  return [
    createRuntime(json.loaders),
    { entry: json.entry, styles: json.styles },
  ];
}
