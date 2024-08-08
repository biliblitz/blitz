import { createRuntime, MANIFEST_SYMBOL, RUNTIME_SYMBOL } from "./runtime.ts";
import type { ClientManifest } from "../server/types.ts";
import { createApp, ref, type Component } from "vue";
import { createHead } from "@unhead/vue";
import { createRouter, createWebHistory } from "vue-router";
import type { SerializedRuntime } from "./entry-point.tsx";

export type Options = {
  manifest: ClientManifest;
};

export function hydrate(App: Component, { manifest }: Options) {
  const runtime = createClientRuntime();

  const app = createApp(App);
  const head = createHead();
  const router = createRouter({
    routes: manifest.routes,
    history: createWebHistory(manifest.base),
  });
  app.use(head);
  app.use(router);
  app.provide(RUNTIME_SYMBOL, ref(runtime));
  app.provide(MANIFEST_SYMBOL, manifest);
  app.mount("#app", true);
}

function createClientRuntime() {
  const element = document.querySelector("script[data-blitz=metadata]");
  if (!element || !element.textContent)
    throw new Error("Can't find SSR hydrate data");

  const json = JSON.parse(element.textContent) as SerializedRuntime;

  return createRuntime(json.loaders);
}
