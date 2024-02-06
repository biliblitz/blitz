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

export const nextTick = () =>
  new Promise<void>((resolve) => setTimeout(resolve, 0));
