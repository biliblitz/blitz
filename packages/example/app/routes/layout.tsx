import { Outlet } from "@biliblitz/blitz";
import { action$, loader$, meta$ } from "@biliblitz/blitz/server";

import "./bbb.css";

const wait = (time: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, time));

export const useLogin = action$(async () => {
  await wait(Math.random() * 1000);

  if (Math.random() < 0.5) {
    throw new Error("what the fuck???");
  }

  return { ok: Math.random() };
});

export const useUsername = loader$(() => {
  return { username: `alice ${Math.random()}` };
});

export const meta = meta$((evt) => {
  return {
    title: "this is meta",
  };
});

export default () => {
  return (
    <div>
      <h1>/layout</h1>
      <Outlet />
    </div>
  );
};
