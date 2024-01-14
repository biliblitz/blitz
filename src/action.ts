import { FetchEvent } from "./event.ts";

export type ActionReturnValue = {} | null;
export type ActionFunction<T extends ActionReturnValue> = (
  evt: FetchEvent
) => T | Promise<T>;

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
export function action$<T extends ActionReturnValue>(fn: ActionFunction<T>) {
  return fn;
}
