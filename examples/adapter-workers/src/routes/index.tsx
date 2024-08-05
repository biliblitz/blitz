import { loader$ } from "@biliblitz/blitz/server";

export const useRandom = loader$(async () => {
  return Math.random();
});

export default function Index() {
  const random = useRandom();

  return <div>hello workers: {random}</div>;
}
