import { index$ } from "@biliblitz/blitz";
import { useUsername } from "./loader.ts";
import { useComputed, useSignal } from "@preact/signals";

export default index$(() => {
  const user = useUsername();
  const username = useComputed(() => user.value.username);
  const count = useSignal(0);

  return (
    <h2 onClick={() => count.value++}>
      Index: {username} - {count}
    </h2>
  );
});
