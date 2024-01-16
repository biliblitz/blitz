type RouterOutletProps = {
  mode: string;
};

export function RouterOutlet(props: RouterOutletProps) {
  const dev = props.mode !== "production";

  return (
    <>
      <div>outlet here</div>

      {dev && <script type="module" src="/@vite/client"></script>}
      {dev && <script type="module" src="/app/entry.client.tsx"></script>}
      {!dev && (
        <script type="module" src="/assets/entry.client-d02b610b.js"></script>
      )}
    </>
  );
}
