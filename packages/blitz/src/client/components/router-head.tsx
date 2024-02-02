import { useComputed } from "@preact/signals";
import { useRuntime } from "../runtime.ts";
import { LoaderStore } from "../../server/event.ts";
import { Graph } from "../../build/graph.ts";
import { getLinkPreloadAs, isAsset, isCss, isJs } from "../../utils/ext.ts";
import { isSSR } from "../../utils/envvars.ts";

export function RouterHead() {
  return (
    <>
      <title>hello world</title>
      <PreloadHeads />
      {isSSR ? <MetadataInjector /> : null}
    </>
  );
}

export type SerializedRuntime = {
  url: string;
  graph: Graph;
  loaders: LoaderStore;
  components: number[];
};

function MetadataInjector() {
  const runtime = useRuntime();

  const serialized = useComputed(() => {
    const object: SerializedRuntime = {
      url: runtime.url.value.href,
      graph: runtime.graph,
      loaders: runtime.loaders.value,
      components: runtime.components.value,
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
