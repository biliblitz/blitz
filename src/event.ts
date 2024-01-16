import type { Middleware } from "./middleware.ts";

export interface FetchEvent {
  /**
   * Request object
   */
  readonly request: Request;

  /**
   * Route params.
   *
   * ```js
   * // app/routes/[user]/index.tsx
   * evt.params.get("user"); // => string
   * ```
   */
  readonly params: Map<string, string>;

  /**
   * Appending headers to final response
   *
   * ```js
   * evt.headers.append("set-cookie", "session=114514");
   * ```
   */
  headers: Headers;

  // /**
  //  * Set the response status code.
  //  *
  //  * ```js
  //  * evt.status = 404;
  //  * ```
  //  */
  // status: number;

  /**
   * Returns the return value of middleware.
   *
   * Use it only if the middleware runs before this call.
   */
  load<T>(middleware: Middleware<T>): T;
}
