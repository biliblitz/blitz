import type { FetchEvent, LoaderStore } from "../server/event.ts";
import type { ServerManifest } from "../server/build.ts";
import { inject, type Ref } from "vue";

export type Runtime = {
  loaders: LoaderStore;
};

export type RuntimeStatic = {
  base: string;
  entry: string;
};

export function createRuntime(
  base: string,
  entry: string,
  loaders: LoaderStore,
): [Runtime, RuntimeStatic] {
  return [{ loaders }, { base, entry }];
}

export function createServerRuntime(
  manifest: ServerManifest,
  event: FetchEvent,
) {
  return createRuntime(manifest.base, manifest.entry, event.loaders);
}

export const RUNTIME_SYMBOL = Symbol("runtime");
export const RUNTIME_STATIC_SYMBOL = Symbol("runtime-static");

export function useRuntime() {
  return inject<Ref<Runtime>>(RUNTIME_SYMBOL)!;
}

export function useRuntimeStatic() {
  return inject<RuntimeStatic>(RUNTIME_STATIC_SYMBOL)!;
}
