import { static$ } from "@biliblitz/blitz/server";

export default static$(() => {
  return [2, 3].map((x) => x.toString());
});
