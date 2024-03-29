import { loader$, RedirectException } from "@biliblitz/blitz/server";

export const useFuckLocker = loader$((c) => {
  const target = Math.random() < 0.5 ? "/foo" : "/bar";
  throw new RedirectException(new URL(target, c.req.url));
});

export default () => {
  return <div>You will never render this</div>;
};
