import { useServerHead } from "@unhead/vue";
import type { LoaderStore } from "../server/router.ts";
import { useRuntime, useRuntimeStatic } from "./runtime.tsx";
import { isDev } from "../utils/envs.ts";
import { computed } from "vue";

export type SerializedRuntime = {
  base: string;
  entry: string;
  loaders: LoaderStore;
};

export function useEntryPoint() {
  const runtime = useRuntime();
  const runtimeStatic = useRuntimeStatic();

  useServerHead({
    script: computed(() => {
      const object: SerializedRuntime = {
        base: runtimeStatic.base,
        entry: runtimeStatic.entry,
        loaders: runtime.value.loaders,
      };

      return [
        {
          type: "application/json",
          "data-blitz": "metadata",
          innerHTML: JSON.stringify(object).replaceAll("/", "\\/"),
        },
      ];
    }),
  });

  if (isDev) {
    // dev specific entry
    useServerHead({
      script: [
        { type: "module", src: `${runtimeStatic.base}@vite/client` },
        { type: "module", src: `${runtimeStatic.base}src/entry.client.tsx` },
      ],
    });
  } else {
    // prod entry
    useServerHead({
      script: [
        { type: "module", src: runtimeStatic.base + runtimeStatic.entry },
      ],
    });
  }
}
