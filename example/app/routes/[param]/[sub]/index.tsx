import { useParam } from "@biliblitz/blitz";
import { meta$ } from "@biliblitz/blitz/server";

export const meta = meta$((c) => {
  const param = c.req.param("sub");
  return { title: `Sub - ${param}` };
});

export default () => {
  const sub = useParam("sub");
  return <div>sub = {sub}</div>;
};
