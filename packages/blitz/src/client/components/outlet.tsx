import { createContext } from "preact";
import { useContext } from "preact/hooks";
import { useRuntimeStatic } from "../runtime.ts";

export const OutletContext = createContext<number[]>([]);

export function Outlet() {
  const outlet = useContext(OutletContext);
  const runtime = useRuntimeStatic();

  if (outlet.length > 0) {
    const [index, ...remains] = outlet;
    const Component = runtime.manifest.components[index] || (() => <Outlet />);

    return (
      <OutletContext.Provider value={remains}>
        <Component />
      </OutletContext.Provider>
    );
  }

  return null;
}
