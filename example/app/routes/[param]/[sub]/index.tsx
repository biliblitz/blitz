import { useParam } from "@biliblitz/blitz";
import { meta$ } from "@biliblitz/blitz/server";

export const meta = meta$((evt) => {
  const param = evt.params.get("sub")!;
  return { title: `Sub - ${param}` };
});

export default () => {
  const sub = useParam("sub");
  return <div>sub = {sub}</div>;
};
