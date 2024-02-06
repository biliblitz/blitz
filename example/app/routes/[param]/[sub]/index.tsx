import { meta$ } from "@biliblitz/blitz/server";

export const meta = meta$((evt) => {
  const param = evt.params.get("sub")!;

  return { title: `Sub - ${param}` };
});

export default () => {
  return <div>sub = {2333}</div>;
};
