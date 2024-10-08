import type { Context, Next } from "hono";
import type { Env } from "./types.ts";

export type Middleware = (
  c: Context<{ Bindings: Env }>,
  next: Next,
) => Promise<void>;

/**
 * Middleware for nesting routes.
 *
 * ```js
 * export const middleware = middleware$(async (c, next) => {
 *   if (await notLogin())
 *     throw new RedirectException(new URL("/login", c.req.url));
 *   if (await permissionDenied())
 *     throw new HTTPException(401, { message: "Permission Denied" });
 *
 *   // Return a Response is not allowed
 *   // return c.json({ ok: true }); // invalid
 *
 *   await next(); // You should always call next after your middleware is done.
 * });
 * ```
 *
 * Export to name `middleware` makes it runs before all loaders / actions for current layout / index.
 *
 * If you only want to use a middleware before some loaders or actions, write this.
 *
 * ```js
 * // Note: export this middleware is not needed.
 * const verifyLogin = middleware$(async (c, next) => {
 *   if (await notLogin())
 *     throw new RedirectException("/login");
 *   await next();
 * });
 * // you can directly use it here
 * export const useMyData = loader$(verifyLogin, async (c) => {
 *   // this runs after virifyLogin
 *   return { verified: true };
 * });
 * ```
 *
 * If you want to merge multiple middlewares.
 *
 * ```js
 * const a = middleware$(async (c, next) => { ... });
 * const b = middleware$(async (c, next) => { ... });
 * const c = middleware$(async (c, next) => { ... });
 * const combined = middleware$(a, b, c);
 * ```
 */
export function middleware$(...middlewares: Middleware[]): Middleware {
  // a no-meaning optimize
  if (middlewares.length === 0) {
    return async (_ctx, next) => {
      await next();
    };
  }

  // a no-meaning optimize
  if (middlewares.length === 1) {
    return middlewares[0];
  }

  return async (ctx, next) => {
    const queue = [...middlewares];
    const nuxt = async () => {
      const middleware = queue.shift();
      if (!middleware) await next();
      else await middleware(ctx, nuxt);
    };
    await nuxt();
  };
}
