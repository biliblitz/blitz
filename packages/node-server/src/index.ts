export type Handler<T> = (req: Request, t?: T) => Response | Promise<Response>;
export type HandlerMiddle<T> = (
  req: Request,
  t?: T,
) => null | Response | Promise<null | Response>;

export { serveStatic } from "./serve-static.ts";
export { getMimeType } from "./mime.ts";
