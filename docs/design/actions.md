# Action

Action 用于描述一次对于服务器的 POST 请求。

## 简述

- Action 仅可以声明于 `app/routes` 文件夹下的 `index.tsx` 或者 `layout.tsx` 文件中；
- 使用 `action$` 函数进行定义，该函数会返回一个钩子函数用于引用请求的结果；
- 定义的所有 Action 必须从该文件中导出；

## 示例

```tsx
import { action$ } from "@biliblitz/blitz/server";

// 使用 action$ 进行定义
export const useLogin = action$(async (evt: FetchEvent) => {
  const formData = await evt.request.formData();

  const username = formData.get("username");
  const password = formData.get("password");

  if (username === "alice" && password === "Passw0rd!") {
    evt.headers.append("Set-Cookie", "user=alice");
    throw new URL("/home", evt.request.url);
  }

  return { ok: false };
});

export default () => {
  const login = useLogin(); // ActionHandler<{ ok: boolean }>

  return (
    <Form action={login}>
      <input type="text" name="username" />
      <input type="password" name="password" />
      <button type="submit">Log in</button>
    </Form>
  );
};
```

## API

### `ActionHandler<T>.state: ReadonlySignal<ActionState>`

是 `"idle"`, `"waiting"`, `"error"`, `"ok"` 中的一个。

### `ActionHandler<T>.data: ReadonlySignal<T | null>`

存放 Action 数据，仅当 `.state` 为 `"ok"` 的时候有值，其余情况为 `null`。

### `ActionHandler<T>.error: ReadonlySignal<Error | null>`

存放 Error 对象，仅当 `.state` 为 `"error"` 的时候有值，其余情况为 `null`。

### `ActionHandler<T>.submit(data: FormData): Promise<void>`

手动发起一次 POST 请求，使用 `Form` 可以自动化提交的行为。该 Promise 会在请求处理结束之后返回。
