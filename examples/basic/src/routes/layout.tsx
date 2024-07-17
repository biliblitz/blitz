import { Outlet } from "@biliblitz/blitz";
import { meta$, action$ } from "@biliblitz/blitz/server";

const wait = (time: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, time));

export const useLogin = action$(async () => {
  await wait(Math.random() * 1000);

  if (Math.random() < 0.5) {
    throw new Error("what the fuck???");
  }

  return { ok: Math.random() };
});

export const meta = meta$((_ctx, meta) => {
  meta.title = meta.title || "Welcome to blitz";
});

export default () => {
  return (
    <div>
      <h1>/layout</h1>
      <Outlet />
    </div>
  );
};
