import { isDev } from "../../utils/envs.ts";
import { useRuntime } from "../runtime.ts";
import { Outlet, OutletContext } from "./outlet.tsx";

export function RouterOutlet() {
  const runtime = useRuntime();

  return (
    <>
      <OutletContext.Provider value={runtime.components}>
        <Outlet />
      </OutletContext.Provider>
      <EntryPoint />
    </>
  );
}

function EntryPoint() {
  const runtime = useRuntime();

  // dev specific entry
  if (isDev) {
    return (
      <>
        <script type="module" src={`${runtime.base}@vite/client`} />
        <script type="module" src={`${runtime.base}app/entry.client.tsx`} />
      </>
    );
  }

  const src = runtime.base + runtime.graph.assets[runtime.graph.entry[0]];

  return <script type="module" src={src} />;
}
