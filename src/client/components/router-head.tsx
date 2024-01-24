import { useComputed } from "@preact/signals";
import { useRuntime } from "../runtime.ts";
import { LoaderReturnValue } from "../../server/loader.ts";

export function RouterHead() {
  return (
    <>
      <title>hello world</title>
      <MetadataInjector />
    </>
  );
}

export type SerializedRuntime = {
  pathname: string;
  loaders: [string, LoaderReturnValue][];
};

function MetadataInjector() {
  const runtime = useRuntime();

  const serialized = useComputed(() => {
    const object: SerializedRuntime = {
      pathname: runtime.pathname.value,
      loaders: runtime.loaders.value,
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
