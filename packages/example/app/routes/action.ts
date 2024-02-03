import { action$ } from "@biliblitz/blitz/server";

const wait = (time: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, time));

export const useLogin = action$(async () => {
  await wait(Math.random() * 1000);

  if (Math.random() < 0.5) {
    throw new Error("what the fuck???");
  }

  return { ok: Math.random() };
});
