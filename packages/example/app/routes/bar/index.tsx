import { Link } from "@biliblitz/blitz";
import { useBarData } from "./loader.ts";
import { useComputed } from "@preact/signals";

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
