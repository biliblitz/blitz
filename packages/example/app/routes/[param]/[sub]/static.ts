import { static$ } from "@biliblitz/blitz/server";

export default static$((env) => {
  const v = +env.params.get("param")!;
  return [1, 2, 3, 4, 5].map((x) => String(v * x));
});
