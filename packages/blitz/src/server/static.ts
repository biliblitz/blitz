export type StaticEnv = {
  /** parent possible params */
  params: Map<string, string>;
};
export type StaticFunction = (env: StaticEnv) => string[] | Promise<string[]>;

/**
 * Static params enumerator for Static Site Generate (SSG).
 *
 * This won't run except SSG rendering.
 *
 * @example
 *
 * ```js
 * // /[param]/static.ts
 * export default static$(() => {
 *   return ["alice", "bob"];
 * });
 * ```
 */
export function static$(fn: StaticFunction) {
  return fn;
}
