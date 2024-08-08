import { loader$ } from "@biliblitz/blitz/server";
import { defineComponent } from "vue";

export const useRandom = loader$(async () => {
  return Math.random();
});

export default defineComponent({
  setup() {
    const random = useRandom();

    return () => <div>hello workers: {random.value}</div>;
  },
});
