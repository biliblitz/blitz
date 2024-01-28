import { action$ } from "@biliblitz/blitz/server";

export const useLogin = action$(() => {
  return { ok: Math.random() < 0.5 };
});
