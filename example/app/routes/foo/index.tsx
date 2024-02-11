import { Link } from "@biliblitz/blitz";
import { loader$ } from "@biliblitz/blitz/server";

export const useFooData = loader$(() => {
  return { data: `Foo loader: ${Math.random()}` };
});

const text = `
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
commodo consequat. Duis aute irure dolor in reprehenderit in voluptate
velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint
occaecat cupidatat non proident, sunt in culpa qui officia deserunt
mollit anim id est laborum.
`;

export default function () {
  const foo = useFooData();

  return (
    <div>
      <strong>/foo/index</strong>

      <p>
        <span id="top">Top</span>
        <Link href="#middle">#middle</Link>
        <Link href="#bottom">#bottom</Link>
        <Link href="/bar">/bar</Link>
        <Link href="/">Home</Link>
      </p>

      <i>{foo.data}</i>
      <p>{text}</p>
      <p>{text}</p>
      <p>{text}</p>
      <p>{text}</p>
      <p>{text}</p>
      <p>{text}</p>
      <p>{text}</p>
      <p>{text}</p>
      <p>{text}</p>
      <p>{text}</p>
      <p>{text}</p>
      <p>{text}</p>
      <p>{text}</p>
      <p>{text}</p>
      <p>
        <span id="middle">Middle</span>
        <Link href="#top">#top</Link>
        <Link href="#bottom">#bottom</Link>
        <Link href="/bar">/bar</Link>
        <Link href="/">Home</Link>
      </p>
      <p>{text}</p>
      <p>{text}</p>
      <p>{text}</p>
      <p>{text}</p>
      <p>{text}</p>
      <p>{text}</p>
      <p>{text}</p>
      <p>{text}</p>
      <p>{text}</p>
      <p>{text}</p>
      <p>{text}</p>
      <p>{text}</p>
      <p>{text}</p>
      <p>{text}</p>
      <p>{text}</p>
      <p>{text}</p>
      <p>{text}</p>
      <p>{text}</p>

      <p>
        <span id="bottom">bottom</span>
        <Link href="#top">#top</Link>
        <Link href="#middle">#middle</Link>
        <Link href="/bar">/bar</Link>
        <Link href="/">Home</Link>
      </p>
    </div>
  );
}
