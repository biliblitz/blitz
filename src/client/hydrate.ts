import { type VNode, render } from "preact";
import { x } from "blitz:manifest";

export function hydrate(vnode: VNode) {
  console.log(x);

  return render(vnode, document, document.documentElement);
}
