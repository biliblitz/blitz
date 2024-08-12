import type { Context } from "hono";
import { useLoader } from "../client/loader.ts";
import { middleware$, type Middleware } from "./middleware.ts";
import type { ComputedRef } from "vue";
import type { Env } from "./types.ts";

export type LoaderReturnValue = {} | null;
export type LoaderFunction<T extends LoaderReturnValue = LoaderReturnValue> = (
  c: Context<{ Bindings: Env }>,
) => T | Promise<T>;
export interface Loader<T extends LoaderReturnValue = LoaderReturnValue> {
  (): LoaderHandler<T>;
  _m?: Middleware;
  _fn?: LoaderFunction<T>;
  _ref?: string;
}
export type LoaderHandler<T extends LoaderReturnValue> = ComputedRef<T>;

const LOADER_SYMBOL = Symbol("loader");

/**
 * Perform data-query for frontend
 *
 * ## Examples
 *
 * ```js
 * // loader.ts
 * export const useUser = loader$(async (c) => {
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
): Loader<T>;
export function loader$<T extends LoaderReturnValue>(
  m1: Middleware,
  fn: LoaderFunction<T>,
): Loader<T>;
export function loader$<T extends LoaderReturnValue>(
  m1: Middleware,
  m2: Middleware,
  fn: LoaderFunction<T>,
): Loader<T>;
export function loader$<T extends LoaderReturnValue>(
  m1: Middleware,
  m2: Middleware,
  m3: Middleware,
  fn: LoaderFunction<T>,
): Loader<T>;
export function loader$<T extends LoaderReturnValue>(
  m1: Middleware,
  m2: Middleware,
  m3: Middleware,
  m4: Middleware,
  fn: LoaderFunction<T>,
): Loader<T>;
export function loader$<T extends LoaderReturnValue>(
  m1: Middleware,
  m2: Middleware,
  m3: Middleware,
  m4: Middleware,
  m5: Middleware,
  fn: LoaderFunction<T>,
): Loader<T>;
export function loader$<T extends LoaderReturnValue>(
  ...args: (Middleware | LoaderFunction<T>)[]
): Loader<T>;
export function loader$<T extends LoaderReturnValue>(
  name: string,
  fn: LoaderFunction<T>,
): Loader<T>;
export function loader$<T extends LoaderReturnValue>(
  name: string,
  m1: Middleware,
  fn: LoaderFunction<T>,
): Loader<T>;
export function loader$<T extends LoaderReturnValue>(
  name: string,
  m1: Middleware,
  m2: Middleware,
  fn: LoaderFunction<T>,
): Loader<T>;
export function loader$<T extends LoaderReturnValue>(
  name: string,
  m1: Middleware,
  m2: Middleware,
  m3: Middleware,
  fn: LoaderFunction<T>,
): Loader<T>;
export function loader$<T extends LoaderReturnValue>(
  name: string,
  m1: Middleware,
  m2: Middleware,
  m3: Middleware,
  m4: Middleware,
  fn: LoaderFunction<T>,
): Loader<T>;
export function loader$<T extends LoaderReturnValue>(
  name: string,
  m1: Middleware,
  m2: Middleware,
  m3: Middleware,
  m4: Middleware,
  m5: Middleware,
  fn: LoaderFunction<T>,
): Loader<T>;
export function loader$<T extends LoaderReturnValue>(
  name: string,
  ...args: (Middleware | LoaderFunction<T>)[]
): Loader<T>;
export function loader$<T extends LoaderReturnValue>(
  ...funcs:
    | [...(Middleware | LoaderFunction<T>)[]]
    | [string, ...(Middleware | LoaderFunction<T>)[]]
): Loader<T> {
  const handler = () => useLoader<T>(handler._ref);
  handler._ref = typeof funcs[0] === "string" ? (funcs.shift() as string) : "";
  handler._fn = funcs.pop() as LoaderFunction<T>;
  handler._m = middleware$(...(funcs as Middleware[]));
  handler[LOADER_SYMBOL] = true;
  return handler;
}

export function isLoader(x: unknown): x is Loader {
  return typeof x === "function" && LOADER_SYMBOL in x;
}
