import { useAction } from "../client/action.ts";
import type { Context } from "hono";
import { middleware$, type Middleware } from "./middleware.ts";
import type { Ref } from "vue";

export type ActionReturnValue = {} | null;
export type ActionFunction<T extends ActionReturnValue = ActionReturnValue> = (
  c: Context,
) => T | Promise<T>;
export interface Action<T extends ActionReturnValue = ActionReturnValue> {
  (): ActionHandler<T>;
  _m?: Middleware;
  _fn?: ActionFunction<T>;
  _ref?: string;
  _mthd?: string;
}
export type ActionState<T> =
  | { status: "idle"; data: null; error: null }
  | { status: "waiting"; data: null; error: null }
  | { status: "ok"; data: T; error: null }
  | { status: "error"; data: null; error: Error };
export type ActionHandler<T extends ActionReturnValue = ActionReturnValue> = {
  ref: string;
  state: Ref<ActionState<T>>;
  method: string;
  submit(data: FormData): Promise<void>;
};

const ACTION_SYMBOL = Symbol("action");

interface DefineAction {
  <T extends ActionReturnValue>(fn: ActionFunction<T>): Action<T>;
  <T extends ActionReturnValue>(
    m1: Middleware,
    fn: ActionFunction<T>,
  ): Action<T>;
  <T extends ActionReturnValue>(
    m1: Middleware,
    m2: Middleware,
    fn: ActionFunction<T>,
  ): Action<T>;
  <T extends ActionReturnValue>(
    m1: Middleware,
    m2: Middleware,
    m3: Middleware,
    fn: ActionFunction<T>,
  ): Action<T>;
  <T extends ActionReturnValue>(
    m1: Middleware,
    m2: Middleware,
    m3: Middleware,
    m4: Middleware,
    fn: ActionFunction<T>,
  ): Action<T>;
  <T extends ActionReturnValue>(
    m1: Middleware,
    m2: Middleware,
    m3: Middleware,
    m4: Middleware,
    m5: Middleware,
    fn: ActionFunction<T>,
  ): Action<T>;
  <T extends ActionReturnValue>(
    ...args: (Middleware | ActionFunction<T>)[]
  ): Action<T>;
  <T extends ActionReturnValue>(name: string, fn: ActionFunction<T>): Action<T>;
  <T extends ActionReturnValue>(
    name: string,
    m1: Middleware,
    fn: ActionFunction<T>,
  ): Action<T>;
  <T extends ActionReturnValue>(
    name: string,
    m1: Middleware,
    m2: Middleware,
    fn: ActionFunction<T>,
  ): Action<T>;
  <T extends ActionReturnValue>(
    name: string,
    m1: Middleware,
    m2: Middleware,
    m3: Middleware,
    fn: ActionFunction<T>,
  ): Action<T>;
  <T extends ActionReturnValue>(
    name: string,
    m1: Middleware,
    m2: Middleware,
    m3: Middleware,
    m4: Middleware,
    fn: ActionFunction<T>,
  ): Action<T>;
  <T extends ActionReturnValue>(
    name: string,
    m1: Middleware,
    m2: Middleware,
    m3: Middleware,
    m4: Middleware,
    m5: Middleware,
    fn: ActionFunction<T>,
  ): Action<T>;
  <T extends ActionReturnValue>(
    name: string,
    ...args: (Middleware | ActionFunction<T>)[]
  ): Action<T>;
}

function action(method: string): DefineAction {
  return <T extends ActionReturnValue>(
    ...args:
      | [...(Middleware | ActionFunction<T>)[]]
      | [string, ...(Middleware | ActionFunction<T>)[]]
  ): Action<T> => {
    const handler = () => useAction<T>(handler._ref, method);
    handler._mthd = method;
    handler._ref = typeof args[0] === "string" ? (args.shift() as string) : "";
    handler._fn = args.pop() as ActionFunction<T>;
    handler._m = middleware$(...(args as Middleware[]));
    handler[ACTION_SYMBOL] = true;
    return handler;
  };
}

/**
 * Making some changes to server.
 *
 * ## Examples
 *
 * ```js
 * import { Form } from "@swwind/firefly";
 *
 * export const useLogin = action$(async (c) => {
 *   const formData = await c.req.formData();
 *   const username = formData.get("username");
 *   const password = formData.get("password");
 *
 *   if (username === "Administrator" && password === "Passw0rd!") {
 *     return { username: "Administrator" }
 *   }
 *
 *   throw new HTTPException(401, { message: "Invalid username/password" });
 * });
 *
 * export default component$(() => {
 *   const login = useLogin();
 *   // to send automatically
 *   <Form action={login}>
 *     <input type="text" name="username" />
 *     <input type="password" name="password" />
 *   </Form>
 *   // to send manually
 *   <button onClick={() => login.submit(new FormData())} />
 * });
 * ```
 *
 * Add an action name if you want.
 *
 * ```js
 * export const useLogin = action$("my-action", async (c) => {
 *   // ...
 * });
 * ```
 *
 * Add middlewares if you want.
 *
 * ```js
 * const auth = middleware$( ... );
 * const verify = middleware$( ... );
 * export const useLogin = action$(auth, verify, async (c) => {
 *   // ...
 * });
 * ```
 */
export const action$ = action("POST");
/** See {@link action$} */
export const delete$ = action("DELETE");
/** See {@link action$} */
export const put$ = action("PUT");
/** See {@link action$} */
export const patch$ = action("PATCH");

export function isAction(x: unknown): x is Action {
  return typeof x === "function" && ACTION_SYMBOL in x;
}
