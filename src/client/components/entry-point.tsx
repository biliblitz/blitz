export function EntryPoint() {
  return <script type="module" src="/assets/entry.client.js"></script>;
}

export function DevEntryPoint() {
  return (
    <>
      <script type="module" src="/@vite/client"></script>
      <script type="module" src="/app/entry.client.tsx"></script>
    </>
  );
}
