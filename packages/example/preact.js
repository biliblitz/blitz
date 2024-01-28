import { signal } from "@preact/signals";
import { useComputed } from "@preact/signals";
import { h } from "preact";
import { render } from "preact-render-to-string";

const s = signal(233);

function Component() {
  const s2 = useComputed(() => s * 2);
  return h("div", { children: s2 });
}

const result = async () => render(h(Component, {}));
console.log(await result());
