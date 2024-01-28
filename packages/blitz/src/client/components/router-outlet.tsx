import { EntryPoint } from "./entry-point.tsx";
import { useRuntime } from "../runtime.ts";
import { VNode } from "preact";

export function RouterOutlet() {
  const runtime = useRuntime();

  const layouts = runtime.components.value
    .map((id) => runtime.manifest.components[id])
    .reduceRight<VNode | null>(
      (children, Component) => <Component>{children}</Component>,
      null,
    );

  return (
    <>
      {layouts}
      <EntryPoint />
    </>
  );
}
