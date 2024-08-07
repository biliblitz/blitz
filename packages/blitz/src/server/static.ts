export type StaticEnv = {
  /** parent possible params */
  params: Map<string, string>;
};
export type StaticFunction = (env: StaticEnv) => string[] | Promise<string[]>;

/**
 * Static params enumerator for SSG (Static Site Generate).
 *
 * This won't run without using static adapter.
 *
 * @example
 *
 * ```js
 * // /[param]/layout.ts
 * export const paths = static$(() => {
 *   return ['one', 'another'];
 * })
 * ```
 */
export function static$(fn: StaticFunction) {
  return fn;
}
