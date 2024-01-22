export class Option<T> {
  #data: T | null = null;

  private constructor() {}

  static Some<T>(t: T) {
    const option = new Option<T>();
    option.#data = t;
    return option;
  }

  static None() {
    return new Option();
  }

  static from<T>(data: T | null | undefined) {
    const option = new Option<T>();
    if (data !== undefined && data !== null) {
      option.#data = data as T;
    }
    return option;
  }

  and<R>(fn: (t: T) => Option<R>) {
    if (this.#data === null) return this as unknown as Option<R>;
    else return fn(this.#data);
  }

  or(fn: () => Option<T>) {
    if (this.#data === null) return fn();
    else return this;
  }

  unwrap() {
    if (this.#data === null) {
      throw new Error("unwrap None");
    }
    return this.#data;
  }

  isSome() {
    return this.#data !== null;
  }

  isNone() {
    return this.#data === null;
  }
}

export function find<T>(
  array: Array<T> | IterableIterator<T>,
  fn: (t: T) => boolean
): Option<T> {
  for (const item of array) {
    if (fn(item)) {
      return Option.Some(item);
    }
  }
  return Option.None() as Option<T>;
}
