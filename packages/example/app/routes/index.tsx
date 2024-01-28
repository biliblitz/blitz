import { index$ } from "@biliblitz/blitz";
import { useUsername } from "./loader.ts";
import { useComputed } from "@preact/signals";

export default index$(() => {
  const user = useUsername();
  const username = useComputed(() => user.value.username);

  return <h2>Index: {username}</h2>;
});
