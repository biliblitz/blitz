import { stringifyQuery, type NavigationGuard } from "vue-router";
import { fetchLoaders } from "./loader.ts";
import { useLoaders } from "./runtime.ts";

export function navigateGuard(): NavigationGuard {
  let initial = true;

  return async (to, from) => {
    // skip first route
    if (initial) {
      initial = false;
      return;
    }

    // skip same page hash jump
    if (
      to.path === from.path &&
      stringifyQuery(to.query) === stringifyQuery(from.query)
    ) {
      return;
    }

    const store = useLoaders();

    // console.log("navigate to", to.fullPath, "from", from.fullPath);

    try {
      const loaders = await fetchLoaders(location.origin + to.fullPath);
      if (loaders.ok === "loader") {
        // update loaders
        store.value = new Map([...store.value, ...loaders.loaders]);
      } else if (loaders.ok === "error") {
        // TODO: do error page rendering
        throw new Error(loaders.error);
      } else if (loaders.ok === "redirect") {
        return loaders.redirect;
      }
    } catch (e) {
      console.error(e);
    }
  };
}
