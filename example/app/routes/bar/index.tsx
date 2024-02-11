import { Link } from "@biliblitz/blitz";
import { loader$ } from "@biliblitz/blitz/server";

export const useBarData = loader$(() => {
  return { data: `Bar loader: ${Math.random()}` };
});

export default function () {
  const bar = useBarData();

  return (
    <div>
      <strong>/bar/index</strong>
      <i>{bar.data}</i>
      <p>
        <Link href="/foo">/foo</Link>
        <Link href="/">Home</Link>
      </p>
    </div>
  );
}
