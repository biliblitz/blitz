function ProdEntryPoint() {
  return <script type="module" src="/build/entry.client.js"></script>;
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
  console.log(import.meta.env.DEV);
  if (import.meta.env?.DEV) {
    return <DevEntryPoint />;
  } else {
    return <ProdEntryPoint />;
  }
}
