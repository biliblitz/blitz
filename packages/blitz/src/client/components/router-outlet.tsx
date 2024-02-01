import { EntryPoint } from "./entry-point.tsx";
import { useRuntime } from "../runtime.ts";
import { Outlet, OutletContext } from "./outlet.tsx";

export function RouterOutlet() {
  const runtime = useRuntime();

  return (
    <>
      <OutletContext.Provider value={runtime.components.value}>
        <Outlet />
      </OutletContext.Provider>
      <EntryPoint />
    </>
  );
}
