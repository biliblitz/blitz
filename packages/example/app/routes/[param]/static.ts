import { static$ } from "@biliblitz/blitz/server";

export default static$(() => {
  return [2, 3, 5, 7, 11, 13, 17, 19].map((x) => x.toString());
});
