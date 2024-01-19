import { FetchEvent } from "./event.ts";

export type LoaderReturnValue = {} | null;
export type LoaderFunction<T extends LoaderReturnValue> = (
  evt: FetchEvent,
) => T | Promise<T>;

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
export function loader$<T extends LoaderReturnValue>(fn: LoaderFunction<T>) {
  return fn;
}
