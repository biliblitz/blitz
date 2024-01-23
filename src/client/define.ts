import type { ComponentChildren, FunctionComponent } from "preact";

export type LayoutComponent<Props> = FunctionComponent<
  { children: ComponentChildren } & Props
>;

export function layout$<Props = {}>(fn: LayoutComponent<Props>) {
  return fn;
}

export function index$<Props = {}>(fn: FunctionComponent<Props>) {
  return fn;
}
