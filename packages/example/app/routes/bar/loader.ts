import { loader$ } from "@biliblitz/blitz/server";

export const useBarData = loader$(() => {
  return { data: `Bar loader: ${Math.random()}` };
});
