export type PathsFunction = (
  env: Record<string, string>,
) => string[] | Promise<string[]>;

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
export function paths$(fn: PathsFunction) {
  return fn;
}
