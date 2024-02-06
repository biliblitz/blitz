import { meta$ } from "@biliblitz/blitz/server";

export const meta = meta$((evt) => {
  const param = evt.params.get("param")!;

  return { title: `Param - ${param}` };
});

export default () => {
  return <div>param = {2333}</div>;
};
