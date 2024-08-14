# Action

Action 用于描述一次对于服务器的修改请求，可以是 POST、DELETE、PATCH 或者 PUT 方法。

## 简述

- Action 仅可以声明于 `src/routes` 文件夹下的 `index.xxx` 或者 `layout.xxx` 文件中；
- 使用 `action$` 函数进行定义，该函数会返回一个钩子函数用于发送请求和获取结果；
- 请不要修改 `action$` 的名称，编译器魔法会检查这个标识符来寻找 Action；
- 定义的所有 Action 必须从该文件中导出。

## 示例

```vue
<!-- src/routes/index.vue -->

<template>
  <Form :action="login">
    <input type="text" name="username" />
    <input type="password" name="password" />
    <button type="submit">Log in</button>
  </Form>
</template>

<script lang="ts">
import { action$, RedirectException } from "@biliblitz/blitz/server";

// 使用 action$ 进行定义并导出
export const useLogin = action$(async (c) => {
  const formData = await c.req.formData();

  const username = formData.get("username");
  const password = formData.get("password");

  if (username === "alice" && password === "Passw0rd!") {
    c.header("Set-Cookie", "user=alice");
    return { ok: true };
  }

  return { ok: false };
});
</script>

<script setup lang="ts">
import { Form, watchAction } from "@biliblitz/blitz";

const login = useLogin(); // ActionHandler<{ ok: boolean }>

// 你可以用 watchAction 函数手动绑定监听
watchAction(login, {
  success(data) {
    alert(data.ok ? "login success" : "login fail");
  },
  error(e) {
    alert("error: " + e.message);
  },
});
</script>
```

## API

```ts
interface ActionHandler<T> {
  // 获取 Action 实例当前的状态和数据。
  status: Ref<ActionState<T>>;
  // 手动发起一次 POST 请求
  submit(formData: FormData): Promise<void>;
}

type ActionState<T> =
  // 初始状态
  | { state: "idle"; data: null; error: null }
  // 发送请求之后
  | { state: "waiting"; data: null; error: null }
  // 收到 200 响应之后
  | { state: "ok"; data: T; error: null }
  // 如果任意一个途中出了问题
  | { state: "error"; data: null; error: Error };
```
