import {
  createRuntime,
  RUNTIME_STATIC_SYMBOL,
  RUNTIME_SYMBOL,
} from "./runtime.tsx";
import type { ClientManifest } from "../server/build.ts";
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
    history: createWebHistory(runtime[1].base),
  });
  app.use(head);
  app.use(router);
  app.provide(RUNTIME_SYMBOL, ref(runtime[0]));
  app.provide(RUNTIME_STATIC_SYMBOL, runtime[1]);
  app.mount("#app", true);
}

function createClientRuntime() {
  const element = document.querySelector("script[data-blitz=metadata]");
  if (!element || !element.textContent)
    throw new Error("Can't find SSR hydrate data");

  const json = JSON.parse(element.textContent) as SerializedRuntime;

  return createRuntime(json.base, json.entry, json.loaders);
}
