import { useParam } from "@biliblitz/blitz";
import { meta$ } from "@biliblitz/blitz/server";

export const meta = meta$((evt) => {
  const param = evt.params.get("param")!;
  return { title: `Param - ${param}` };
});

export default () => {
  const param = useParam("param");
  return <div>param = {param}</div>;
};
