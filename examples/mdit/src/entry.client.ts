import { manifest } from "blitz:manifest/client";
import { createHead } from "@unhead/vue";
import { createRouter, createWebHistory } from "vue-router";
import { createApp } from "vue";
import { createBlitz } from "@biliblitz/blitz";

import Root from "./Root.vue";

const head = createHead();
const router = createRouter({
  routes: manifest.routes,
  history: createWebHistory(manifest.base),
  scrollBehavior(to, _from, savedPosition) {
    if (to.hash) {
      return { el: to.hash, behavior: "smooth" };
    }
    return savedPosition || { top: 0 };
  },
});
const blitz = createBlitz({ manifest });

createApp(Root).use(head).use(router).use(blitz).mount("#app", true);
