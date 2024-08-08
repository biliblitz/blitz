import { useHead, useServerHead } from "@unhead/vue";
import type { LoaderStore } from "../server/router.ts";
import { useManifest, useRuntime } from "./runtime.ts";
import { isDev } from "../utils/envs.ts";
import { computed } from "vue";

export type SerializedRuntime = {
  loaders: LoaderStore;
};

export function useEntryPoint() {
  const runtime = useRuntime();
  const manifest = useManifest();

  useHead({
    link: manifest.styles.map((href) => ({
      rel: "stylesheet",
      href: manifest.base + href,
    })),
  });

  useServerHead({
    script: computed(() => {
      const object: SerializedRuntime = {
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
        { type: "module", src: manifest.base + "@vite/client" },
        { type: "module", src: manifest.base + "src/entry.client.tsx" },
      ],
    });
  } else {
    // prod entry
    useServerHead({
      script: [{ type: "module", src: manifest.base + manifest.entry }],
    });
  }
}
