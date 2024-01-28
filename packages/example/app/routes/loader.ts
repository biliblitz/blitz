import { loader$ } from "@biliblitz/blitz/server";

export const useUsername = loader$(() => {
  return { username: "alice" };
});
