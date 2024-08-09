import { isAction, type Action } from "../server/action.ts";
import { isLoader, type Loader } from "../server/loader.ts";
import type { Middleware } from "../server/middleware.ts";
import { hashRef } from "./crypto.ts";

export function unwrapServerLayer(exports: Record<string, unknown>) {
  const loaders: Loader[] = [];
  const actions: Action[] = [];
  let middleware: Middleware | null = null;

  for (const [key, value] of Object.entries(exports)) {
    if (key === "default") continue;

    if (key === "middleware") {
      middleware = value as Middleware;
      continue;
    }

    if (isLoader(value)) {
      const idx = loaders.push(value);
      value._ref = value._ref || hashRef(`loader-${idx}-${key}`);
      continue;
    }

    if (isAction(value)) {
      const idx = actions.push(value);
      value._ref = value._ref || hashRef(`action-${idx}-${key}`);
      continue;
    }

    console.warn(`unknown export: ${key}`, value, isLoader(value));
  }

  return [loaders, actions, middleware];
}
