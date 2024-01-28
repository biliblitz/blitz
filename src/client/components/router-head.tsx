import { useComputed } from "@preact/signals";
import { useRuntime } from "../runtime.ts";
import { LoaderStoreArray } from "../../server/event.ts";

export function RouterHead() {
  return (
    <>
      <title>hello world</title>
      <MetadataInjector />
    </>
  );
}

export type SerializedRuntime = {
  url: string;
  loaders: LoaderStoreArray;
};

function MetadataInjector() {
  const runtime = useRuntime();

  const serialized = useComputed(() => {
    const object: SerializedRuntime = {
      url: runtime.url.value.href,
      loaders: Array.from(runtime.loaders.value),
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
