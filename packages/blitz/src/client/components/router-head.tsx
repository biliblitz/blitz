import { useComputed } from "@preact/signals";
import { useRuntime } from "../runtime.ts";
import { LoaderStore } from "../../server/event.ts";
import { Graph } from "../../build/graph.ts";
import { getLinkPreloadAs, isAsset, isCss, isJs } from "../../utils/ext.ts";
import { isSSR } from "../../utils/envs.ts";
import { Meta } from "../../server/meta.ts";
import { Params } from "../../server/router.ts";

export function RouterHead() {
  return (
    <>
      <DocumentHead />
      <PreloadHeads />
      {isSSR ? <MetadataInjector /> : null}
    </>
  );
}

export type SerializedRuntime = {
  meta: Meta;
  graph: Graph;
  params: Params;
  loaders: LoaderStore;
  components: number[];
};

function MetadataInjector() {
  const runtime = useRuntime();

  const serialized = useComputed(() => {
    const object: SerializedRuntime = {
      meta: runtime.meta.value,
      graph: runtime.graph,
      params: runtime.params.value,
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

function DocumentHead() {
  const runtime = useRuntime();

  return (
    <>
      <title>{runtime.meta.value.title}</title>
      {runtime.meta.value.meta.map((props, index) => (
        <meta {...props} key={index} />
      ))}
      {runtime.meta.value.link.map((props, index) => (
        <link {...props} key={index} />
      ))}
    </>
  );
}
