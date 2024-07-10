/** unique array */
export const unique = <T>(t: T[]) => Array.from(new Set(t));

let currentTimeout: number | null = null;

export function slowDown(fn: () => void, timeout = 500) {
  if (currentTimeout) {
    clearTimeout(currentTimeout);
  }

  currentTimeout = (setTimeout as Window["setTimeout"])(fn, timeout);
}
