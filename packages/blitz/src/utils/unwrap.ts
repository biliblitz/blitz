import { isAction, type Action } from "../server/action.ts";
import { isLoader, type Loader } from "../server/loader.ts";
import type { Middleware } from "../server/middleware.ts";
import { hashRef } from "./crypto.ts";

export function unwrapServerLayer(
  exports: Record<string, unknown>,
  salt: string,
) {
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
      value._ref = value._ref || hashRef(`${salt}-${key}`);
      loaders.push(value);
      continue;
    }

    if (isAction(value)) {
      value._ref = value._ref || hashRef(`${salt}-${key}`);
      actions.push(value);
      continue;
    }

    console.warn(`unknown export: ${key}`, value, isLoader(value));
  }

  return [loaders, actions, middleware];
}
