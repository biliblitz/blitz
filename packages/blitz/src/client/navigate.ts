import type { NavigationGuard } from "vue-router";

export function navigateGuard(): NavigationGuard {
  return async (to, _from) => {
    console.log("navigate to", to.path);
  };
}
