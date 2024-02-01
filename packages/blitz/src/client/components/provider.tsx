import { JSX } from "preact";
import { useEffect } from "preact/hooks";
import { HistoryState, replaceState } from "../history.ts";
import { useRuntime } from "../runtime.ts";
import { useRender } from "../navigate.ts";

interface ProviderProps extends JSX.HTMLAttributes<HTMLHtmlElement> {}

export function BlitzCityProvider(props: ProviderProps) {
  const { children, ...remains } = props;

  const runtime = useRuntime();
  const render = useRender();

  useEffect(() => {
    // initialize
    replaceState({
      stores: Array.from(runtime.loaders.value),
      position: [0, 0],
      components: runtime.components.value,
    });
    // add popstate callback
    addEventListener("popstate", async (e) => {
      const state = e.state as HistoryState;
      await render(state.components, state.stores);
      scrollTo(state.position[0], state.position[1]);
    });
  }, []);

  return <html {...remains}>{children}</html>;
}
