import { useAction } from "../client/action.ts";
import { Context } from "hono";

export type ActionReturnValue = {} | null;
export type ActionFunction<T extends ActionReturnValue = ActionReturnValue> = (
  c: Context,
) => T | Promise<T>;
export interface Action<T extends ActionReturnValue = ActionReturnValue> {
  (): ActionHandler<T>;
  _fn?: ActionFunction<T>;
  _ref?: string;
}
export type ActionState<T> =
  | { state: "idle"; data: null; error: null }
  | { state: "waiting"; data: null; error: null }
  | { state: "ok"; data: T; error: null }
  | { state: "error"; data: null; error: Error };
export type ActionHandler<T extends ActionReturnValue = ActionReturnValue> = {
  ref: string;
  state: ActionState<T>;
  submit(data: FormData): Promise<void>;
};

/**
 * Making some changes to local database
 *
 * ## Examples
 *
 * ```js
 * // action.ts
 * export const useLogin = action$((evt) => {
 *   const formData = await evt.request.formData();
 *   const username = formData.get("username");
 *   const password = formData.get("password");
 *
 *   if (username === "Administrator" && password === "Passw0rd!") {
 *     return { username: "Administrator" }
 *   }
 *
 *   throw new Response("Invalid username/password", { status: 401 });
 * });
 * ```
 *
 * And
 *
 * ```jsx
 * // index.tsx
 * import { useLogin } from "./action.ts";
 * import { Form } from "@biliblitz/blitz";
 * export default function () {
 *   const login = useLogin();
 *   // automatically
 *   <Form action={login}>
 *     <input type="text" name="username" />
 *     <input type="password" name="password" />
 *   </Form>
 *   // manually
 *   <button onClick={() => login.submit(new FormData())} />
 * }
 * ```
 */
export function action$<T extends ActionReturnValue>(
  fn: ActionFunction<T>,
): Action<T> {
  const handler = () => useAction<T>(handler._ref);
  handler._fn = fn;
  handler._ref = "";
  return handler;
}
