import {
  createRuntime,
  LOADERS_SYMBOL,
  MANIFEST_SYMBOL,
  type Runtime,
} from "./runtime.ts";
import type { ClientManifest, Graph } from "../server/types.ts";
import { shallowRef, type Plugin } from "vue";
import type { SerializedRuntime } from "./provider.ts";
import { navigateGuard } from "./navigate.ts";

export type Options = {
  manifest: ClientManifest;
};

export function createBlitz({ manifest }: Options): Plugin {
  const [runtime, graph] = createClientRuntime();

  return {
    install(app) {
      const router = app.config.globalProperties.$router;

      if (!router) {
        throw new Error("Must use blitz after use router.");
      }

      router.beforeResolve(navigateGuard());

      app
        .provide(LOADERS_SYMBOL, shallowRef(new Map(runtime.loaders)))
        .provide(MANIFEST_SYMBOL, { ...manifest, ...graph });
    },
  };
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
