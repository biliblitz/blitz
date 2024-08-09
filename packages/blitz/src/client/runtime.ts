import type { FetchEvent, LoaderStore } from "../server/event.ts";
import { inject, type Ref } from "vue";
import type { ClientManifest, Graph } from "../server/types.ts";

export type Runtime = {
  loaders: LoaderStore;
};

export function createRuntime(loaders: LoaderStore): Runtime {
  return { loaders };
}

export function createServerRuntime(event: FetchEvent) {
  return createRuntime(event.loaders);
}

export const RUNTIME_SYMBOL = Symbol("runtime");
export const MANIFEST_SYMBOL = Symbol("manifest");

export function useRuntime() {
  return inject<Ref<Runtime>>(RUNTIME_SYMBOL)!;
}

export function useManifest() {
  return inject<ClientManifest & Graph>(MANIFEST_SYMBOL)!;
}
