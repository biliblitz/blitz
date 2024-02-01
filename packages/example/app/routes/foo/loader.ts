import { loader$ } from "@biliblitz/blitz/server";

export const useFooData = loader$(() => {
  return { data: `Foo loader: ${Math.random()}` };
});
