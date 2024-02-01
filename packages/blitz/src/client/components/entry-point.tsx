import { useRuntime } from "../runtime.ts";

function ProdEntryPoint() {
  const runtime = useRuntime();

  return (
    <script
      type="module"
      src={`/${runtime.graph.assets[runtime.graph.entry[0]]}`}
    />
  );
}

function DevEntryPoint() {
  return (
    <>
      <script type="module" src="/@vite/client"></script>
      <script type="module" src="/app/entry.client.tsx"></script>
    </>
  );
}

export function EntryPoint() {
  if (import.meta.env?.DEV) {
    return <DevEntryPoint />;
  } else {
    return <ProdEntryPoint />;
  }
}
