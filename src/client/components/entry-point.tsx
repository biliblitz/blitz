function ProdEntryPoint() {
  return <script type="module" src="/assets/entry.client.js"></script>;
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
  if (import.meta.env.MODE === "production") {
    return <ProdEntryPoint />;
  } else {
    return <DevEntryPoint />;
  }
}
