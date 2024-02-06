import { static$ } from "@biliblitz/blitz/server";

export default static$((env) => {
  const v = +env.params.get("param")!;
  return [1, 2, 3].map((x) => String(v * x));
});
