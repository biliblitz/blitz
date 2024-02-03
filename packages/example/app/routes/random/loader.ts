import { loader$ } from "@biliblitz/blitz/server";

export const useFuckLocker = loader$((evt) => {
  const target = Math.random() < 0.5 ? "/foo" : "/bar";
  throw new URL(target, evt.request.url);
});
