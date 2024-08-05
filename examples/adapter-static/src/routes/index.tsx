import { Link } from "@biliblitz/blitz";

export default function Index() {
  return (
    <div class="box">
      <div>/index.tsx</div>
      <div>
        Goto <Link href="/about">about</Link>
      </div>
    </div>
  );
}
