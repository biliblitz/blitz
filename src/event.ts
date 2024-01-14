import type { Middleware } from "./middleware.ts";

export interface FetchEvent {
  /**
   * Request object
   */
  readonly request: Request;

  /**
   * Appending headers to final response
   *
   * ```js
   * evt.headers.append("set-cookie", "session=114514");
   * ```
   */
  headers: Headers;

  /**
   * Route params.
   *
   * ```js
   * // app/routes/[user]/index.tsx
   * evt.params.get("user"); // => string
   * ```
   */
  params: Map<string, string>;

  /**
   * Returns the return value of middleware.
   *
   * Use it only if the middleware runs before this call.
   */
  load<T>(middleware: Middleware<T>): T;
}
