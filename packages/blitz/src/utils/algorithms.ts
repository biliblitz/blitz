/** unique array */
export const unique = <T>(t: T[]) => Array.from(new Set(t));

export const nextTick = () =>
  new Promise<void>((resolve) => setTimeout(resolve, 0));
