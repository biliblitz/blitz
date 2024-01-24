import { VNode, render } from "preact";
import { x } from "blitz:manifest";
import { Runtime, RuntimeContext } from "./runtime.ts";
import { SerializedRuntime } from "./components/router-head.tsx";

export function hydrate(vnode: VNode) {
  console.log(x);

  const runtime = createClientRuntime();

  return render(
    <RuntimeContext.Provider value={runtime}>{vnode}</RuntimeContext.Provider>,
    document,
    document.documentElement,
  );
}

function createClientRuntime() {
  const element = document.querySelector("script[data-blitz-runtime]");
  if (!element || !element.textContent) throw new Error("Unreachable");
  const json = JSON.parse(element.textContent) as SerializedRuntime;
  return new Runtime(json.pathname, json.loaders);
}
