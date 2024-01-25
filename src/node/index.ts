export type Handler<T> = (req: Request, t?: T) => Response | Promise<Response>;
export type HandlerMiddle<T> = (
  req: Request,
  t?: T,
) => null | Response | Promise<null | Response>;
export type Condition<T> = (req: Request, t?: T) => boolean | Promise<boolean>;

export function chain<T>(...handlers: HandlerMiddle<T>[]): HandlerMiddle<T> {
  return async (req, t) => {
    for (const handler of handlers) {
      const res = await handler(req, t);
      if (res === null) continue;
      else return res;
    }
    return null;
  };
}

export function when<T>(
  condition: Condition<T>,
  branchTrue: HandlerMiddle<T>,
  branchFalse?: HandlerMiddle<T>,
): HandlerMiddle<T> {
  return async (req, t) =>
    (await condition(req, t))
      ? await branchTrue(req, t)
      : branchFalse
        ? await branchFalse(req, t)
        : null;
}

export function startsWith<T>(prefix: string): Condition<T> {
  return (req) => new URL(req.url).pathname.startsWith(prefix);
}

export function endsWith<T>(suffix: string): Condition<T> {
  return (req) => new URL(req.url).pathname.endsWith(suffix);
}

export function matches<T>(regex: RegExp): Condition<T> {
  return (req) => regex.test(new URL(req.url).pathname);
}

export function and<T>(...conditions: Condition<T>[]): Condition<T> {
  return (req) => conditions.every((cond) => cond(req));
}

export function or<T>(...conditions: Condition<T>[]): Condition<T> {
  return (req) => conditions.some((cond) => cond(req));
}

export { serveStatic } from "./serve-static.ts";
