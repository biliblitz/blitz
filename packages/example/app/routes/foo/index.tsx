import { Link } from "@biliblitz/blitz";
import { useFooData } from "./loader.ts";
import { useComputed } from "@preact/signals";

export default function () {
  const foo = useFooData();
  const data = useComputed(() => {
    console.log("running foo computed");
    return foo.value.data;
  });

  return (
    <div>
      <strong>/foo/index</strong>
      <i>{data}</i>
      <p>
        <Link href="/bar">/bar</Link>
        <Link href="/">Home</Link>
      </p>
    </div>
  );
}
