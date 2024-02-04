import { meta$ } from "@biliblitz/blitz/server";

export default meta$((evt) => {
  const param = evt.params.get("sub")!;

  return { title: `Sub - ${param}` };
});
