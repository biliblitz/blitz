import { useRuntime, useRuntimeStatic } from "../runtime.ts";
import type { LoaderStore } from "../../server/event.ts";
import type { Graph } from "../../server/build.ts";
import type { Meta } from "../../server/meta.ts";
import type { Params } from "../../server/router.ts";
import { useServerHead } from "@unhead/vue";

export type SerializedRuntime = {
  meta: Meta;
  base: string;
  graph: Graph;
  params: Params;
  loaders: LoaderStore;
  components: number[];
};

export function MetadataInjector() {
  const runtime = useRuntime();
  const runtimeStatic = useRuntimeStatic();

  const object: SerializedRuntime = {
    meta: runtime.meta,
    base: runtimeStatic.base,
    graph: runtimeStatic.graph,
    params: runtime.params,
    loaders: runtime.loaders,
    components: runtime.components,
  };

  const serialized = JSON.stringify(object).replaceAll("/", "\\/");

  useServerHead({
    script: [
      {
        type: "application/json",
        "data-blitz": "metadata",
        innerHTML: serialized,
      },
    ],
  });
}
