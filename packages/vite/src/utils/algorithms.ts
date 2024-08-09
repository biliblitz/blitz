/** unique array */
export const unique = <T>(t: T[]) => Array.from(new Set(t));

// for shortand
export const s = JSON.stringify;

export function waitAsync<T>(promise: () => Promise<T>) {
  let running = false;
  let resolves = [] as ((t: T) => void)[];
  let rejects = [] as ((e: unknown) => void)[];
  return () =>
    new Promise<T>((resolve, reject) => {
      resolves.push(resolve);
      rejects.push(reject);
      if (!running) {
        running = true;
        promise()
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

export function cacheAsync<T>(fn: () => Promise<T>) {
  let value: T | null = null;

  return {
    fresh() {
      value = null;
    },

    async fetch() {
      return value || (value = await fn());
    },
  };
}
