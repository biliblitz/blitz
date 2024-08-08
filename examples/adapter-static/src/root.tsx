import { useEntryPoint } from "@biliblitz/blitz";
import { useHead } from "@unhead/vue";
import { defineComponent, h } from "vue";
import { RouterView } from "vue-router";

import "./assets/style.css";

export default defineComponent({
  setup() {
    useHead({
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1.0" },
      ],
    });

    useEntryPoint();

    return () => h(RouterView);
  },
});
