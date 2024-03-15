import { Context } from "hono";

export interface Middleware<T = void> {
  (c: Context): T | Promise<T>;
  _ref?: string;
}

/**
 * Middleware for nesting routes.
 *
 * ## Throws Response
 *
 * - When you throw a response, blitz will catch it and renders an error page.
 * - When you throw a URL, blitz will catch it and returns 301 redirect.
 * - When you throw a Error (or anything else), blitz will catch it and renders an error page with 500 status.
 *
 * ```js
 * export default middleware$((evt) => {
 *   if (notLogin())
 *     throw new URL("/login", evt.request.url);
 *   if (permissionDenied())
 *     throw new Response("Permission Denied", { status: 401 });
 *   throw new Error("not implemented yet");
 * })
 * ```
 *
 * ## Returning Data
 *
 * Middlewares are allowed to return some data for loaders and actions.
 *
 * ```js
 * export default middleware$((evt) => {
 *   return { session: evt.request.headers.get("X-Session") }
 * })
 * ```
 *
 * In loaders/actions, use `evt.load()` to access the result.
 *
 * ```js
 * // loader.ts
 * import middleware from "./middleware.ts";
 *
 * export const useSomeLoader = loader$((evt) => {
 *   const data = evt.load(middleware);
 *   console.log(data); // { session: 'xxx' }
 * })
 * ```
 *
 * Use it only if the middleware runs before loader/action, otherwise a 500 error will be reported.
 */
export function middleware$<T = void>(middleware: Middleware<T>) {
  return middleware;
}
