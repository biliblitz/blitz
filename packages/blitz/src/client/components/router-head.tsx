import { useRuntime } from "../runtime.ts";
import { LoaderStore } from "../../server/event.ts";
import { Graph } from "../../server/build.ts";
import { getLinkPreloadAs, isAsset, isCss, isJs } from "../../utils/ext.ts";
import { isSSR } from "../../utils/envs.ts";
import { Meta } from "../../server/meta.ts";
import { Params } from "../../server/router.ts";
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

  const serialized = useMemo(() => {
    const object: SerializedRuntime = {
      meta: runtime.meta,
      base: runtime.base,
      graph: runtime.graph,
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

  return (
    <>
      {runtime.preloads.map((id) => {
        const href = runtime.base + runtime.graph.assets[id];
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
