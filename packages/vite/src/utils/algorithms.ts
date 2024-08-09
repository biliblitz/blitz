/** unique array */
export const unique = <T>(t: T[]) => Array.from(new Set(t));

// for shortand
export const s = JSON.stringify;

export function waitAsync<T, R>(promise: (r: R) => Promise<T>) {
  let running = false;
  let resolves = [] as ((t: T) => void)[];
  let rejects = [] as ((e: unknown) => void)[];
  return (r: R) =>
    new Promise<T>((resolve, reject) => {
      resolves.push(resolve);
      rejects.push(reject);
      if (!running) {
        running = true;
        promise(r)
          .then((t) => {
            const copy = resolves;
            running = false;
            resolves = [];
            rejects = [];

            for (const resolve of copy) {
              resolve(t);
            }
          })
          .catch((e) => {
            const copy = rejects;
            running = false;
            resolves = [];
            rejects = [];

            for (const reject of copy) {
              reject(e);
            }
          });
      }
    });
}

export function cacheAsync<T, R>(fn: (r: R) => Promise<T>) {
  let value: T | null = null;

  return {
    fresh() {
      value = null;
    },

    async value(r: R) {
      return value || (value = await fn(r));
    },
  };
}
