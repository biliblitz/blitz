import { useSignal } from "@preact/signals";
import { EntryPoint } from "./entry-point.tsx";

export function RouterOutlet() {
  const count = useSignal(0);

  return (
    <>
      <div>
        <span>{count}</span>
        <button onClick={() => count.value++}>+1</button>
      </div>

      <EntryPoint />
    </>
  );
}
