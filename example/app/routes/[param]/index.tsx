import { useParam } from "@biliblitz/blitz";
import { meta$ } from "@biliblitz/blitz/server";

export const meta = meta$((c, meta) => {
  const param = c.req.param("param")!;
  meta.title = `Param - ${param}`;
});

export default () => {
  const param = useParam("param");
  return <div>param = {param}</div>;
};
