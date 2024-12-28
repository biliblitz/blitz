import { useHead } from "@unhead/vue";
import type { LoaderStore } from "../server/router.ts";
import { useLoaders, useManifest } from "./runtime.ts";
import { isDev, isSSR } from "../utils/envs.ts";
import { computed } from "vue";

export type SerializedRuntime = {
  entry: string;
  styles: string[];
  loaders: LoaderStore;
};

function useEntryPoint() {
  const store = useLoaders();
  const manifest = useManifest();

  useHead({
    link: manifest.styles.map((href) => ({
      rel: "stylesheet",
      href: manifest.base + href,
    })),
  });

  if (isSSR) {
    useHead({
      script: computed(() => {
        const object: SerializedRuntime = {
          entry: manifest.entry,
          styles: manifest.styles,
          loaders: [...store.value],
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
      useHead({
        script: [
          { type: "module", defer: true, src: manifest.base + "@vite/client" },
          {
            type: "module",
            defer: true,
            src: manifest.base + "src/entry.client.ts",
          },
        ],
      });
    } else {
      // prod entry
      useHead({
        script: [
          {
            type: "module",
            defer: true,
            src: manifest.base + manifest.entry,
          },
        ],
      });
    }
  }
}

export function useBlitz() {
  useEntryPoint();
}
