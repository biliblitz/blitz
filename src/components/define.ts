import { ComponentChildren, FunctionComponent } from "preact";

export function layout$<Props = {}>(
  fn: FunctionComponent<{ children: ComponentChildren } & Props>,
) {
  return fn;
}

export function index$<Props = {}>(fn: FunctionComponent<Props>) {
  return fn;
}
