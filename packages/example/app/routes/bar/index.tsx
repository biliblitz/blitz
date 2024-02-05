import { Link } from "@biliblitz/blitz";
import { loader$ } from "@biliblitz/blitz/server";
import { useComputed } from "@preact/signals";

export const useBarData = loader$(() => {
  return { data: `Bar loader: ${Math.random()}` };
});

export default function () {
  const bar = useBarData();
  const data = useComputed(() => bar.value.data);

  return (
    <div>
      <strong>/bar/index</strong>
      <i>{data}</i>
      <p>
        <Link href="/foo">/foo</Link>
        <Link href="/">Home</Link>
      </p>
    </div>
  );
}
