/** longest common prefix */
export const lcp = <T>(a: T[], b: T[]) => {
  const c = [] as T[];
  for (let i = 0, len = Math.min(a.length, b.length); i < len; ++i)
    if (a[i] === b[i]) c.push(a[i]);
    else break;
  return c;
};

/** unique array */
export const unique = <T>(t: T[]) => Array.from(new Set(t));

/** check if two array is === same */
export const same = <T>(a: T[], b: T[]) => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
};

export const nextTick = () =>
  new Promise<void>((resolve) => setTimeout(resolve, 0));
