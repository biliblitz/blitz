import {
  createRuntime,
  MANIFEST_SYMBOL,
  RUNTIME_SYMBOL,
  type Runtime,
} from "./runtime.ts";
import type { ClientManifest, Graph } from "../server/types.ts";
import { createApp, shallowRef, type Component } from "vue";
import { createHead } from "@unhead/vue";
import { createRouter, createWebHistory } from "vue-router";
import type { SerializedRuntime } from "./provider.ts";
import { navigateGuard } from "./navigate.ts";

export type Options = {
  manifest: ClientManifest;
};

export function createClientApp(root: Component, { manifest }: Options) {
  const [runtime, graph] = createClientRuntime();

  const head = createHead();
  const router = createRouter({
    routes: manifest.routes,
    history: createWebHistory(manifest.base),
  });

  router.beforeResolve(navigateGuard());

  const app = createApp(root)
    .use(head)
    .use(router)
    .provide(RUNTIME_SYMBOL, shallowRef(runtime))
    .provide(MANIFEST_SYMBOL, { ...manifest, ...graph });

  return { app, router, head };
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
