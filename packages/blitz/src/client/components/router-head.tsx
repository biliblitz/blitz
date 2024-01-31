import { useComputed } from "@preact/signals";
import { useRuntime } from "../runtime.ts";
import { LoaderStoreArray } from "../../server/event.ts";
import { Graph } from "../../build/graph.ts";
import { getLinkPreloadAs, isAsset, isCss, isJs } from "../../utils/ext.ts";

export function RouterHead() {
  return (
    <>
      <title>hello world</title>
      <PreloadHeads />
      <MetadataInjector />
    </>
  );
}

export type SerializedRuntime = {
  url: string;
  loaders: LoaderStoreArray;
  components: number[];
  graph: Graph;
};

function MetadataInjector() {
  const runtime = useRuntime();

  const serialized = useComputed(() => {
    const object: SerializedRuntime = {
      url: runtime.url.value.href,
      loaders: Array.from(runtime.loaders.value),
      components: runtime.components.value,
      graph: runtime.graph,
    };

    return JSON.stringify(object).replaceAll("/", "\\/");
  });

  return (
    <script
      type="application/json"
      data-blitz-metadata
      dangerouslySetInnerHTML={{ __html: serialized.value }}
    />
  );
}

function PreloadHeads() {
  const runtime = useRuntime();

  return (
    <>
      {runtime.preloads.value.map((id) => {
        const href = "/" + runtime.graph.assets[id];
        if (isJs(href)) return <link rel="modulepreload" href={href} />;
        if (isCss(href)) return <link rel="stylesheet" href={href} />;
        if (isAsset(href))
          return <link rel="preload" href={href} as={getLinkPreloadAs(href)} />;
      })}
    </>
  );
}
