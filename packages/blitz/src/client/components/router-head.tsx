import { useRuntime, useRuntimeStatic } from "../runtime.ts";
import type { LoaderStore } from "../../server/event.ts";
import type { Graph } from "../../server/build.ts";
import { getLinkPreloadAs, isAsset, isCss, isJs } from "../../utils/ext.ts";
import { isSSR } from "../../utils/envs.ts";
import type { Meta } from "../../server/meta.ts";
import type { Params } from "../../server/router.ts";
import { useMemo } from "preact/hooks";

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
  base: string;
  graph: Graph;
  params: Params;
  loaders: LoaderStore;
  components: number[];
};

function MetadataInjector() {
  const runtime = useRuntime();
  const runtimeStatic = useRuntimeStatic();

  const serialized = useMemo(() => {
    const object: SerializedRuntime = {
      meta: runtime.meta,
      base: runtimeStatic.base,
      graph: runtimeStatic.graph,
      params: runtime.params,
      loaders: runtime.loaders,
      components: runtime.components,
    };

    return JSON.stringify(object).replaceAll("/", "\\/");
  }, [runtime]);

  return (
    <script
      type="application/json"
      data-blitz-metadata
      dangerouslySetInnerHTML={{ __html: serialized }}
    />
  );
}

function PreloadHeads() {
  const runtime = useRuntime();
  const runtimeStatic = useRuntimeStatic();

  return (
    <>
      {runtime.preloads.map((id) => {
        const href = runtimeStatic.base + runtimeStatic.graph.assets[id];
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
      <title>{runtime.meta.title}</title>
      {runtime.meta.description && (
        <meta name="description" content={runtime.meta.description} />
      )}
      {runtime.meta.meta.map((props, index) => (
        <meta {...props} key={index} />
      ))}
      {runtime.meta.link.map((props, index) => (
        <link {...props} key={index} />
      ))}
    </>
  );
}
