import { Context } from "hono";
import { useLoader } from "../client/loader.ts";

export type LoaderReturnValue = {} | null;
export type LoaderFunction<T extends LoaderReturnValue = LoaderReturnValue> = (
  c: Context,
) => T | Promise<T>;
export interface Loader<T extends LoaderReturnValue = LoaderReturnValue> {
  (): LoaderHandler<T>;
  _fn?: LoaderFunction<T>;
  _ref?: string;
}
export type LoaderHandler<T extends LoaderReturnValue> = T;

/**
 * Perform data-query for frontend
 *
 * ## Examples
 *
 * ```js
 * // loader.ts
 * export const useUser = loader$(async (evt) => {
 *   return { username: 'Alice' };
 * });
 * ```
 *
 * And
 *
 * ```jsx
 * // index.tsx
 * import { useUser } from "./loader.ts";
 * export default function () {
 *   const user = useUser(); // => ReadonlySignal<{ username: string }>
 *   return <span>username = {user.value.username}</span>
 * }
 * ```
 *
 * ## Linking Middleware
 *
 * ```js
 * import middleware from "./middleware.ts";
 * export const useUser = loader$((evt) => {
 *   // get return value of middleware
 *   const value = evt.load(middleware);
 * });
 * ```
 */
export function loader$<T extends LoaderReturnValue>(
  fn: LoaderFunction<T>,
): Loader<T> {
  const handler = () => useLoader<T>(handler._ref);
  handler._fn = fn;
  handler._ref = "";
  return handler;
}
