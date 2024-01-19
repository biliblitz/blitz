# Actions

Action 用于抽象一次 POST 请求。

## 基本用法

创建 `action.ts` 文件，在其中使用 `action$` 函数定义，并命名导出即可。

```jsx
import { action$ } from "@biliblitz/blitz";

export const useLogin = action$(async (evt) => {
  const formData = await evt.request.formData();
  const username = formData.get("username");
  const password = formData.get("password");
  if (await isCorrect(username, password)) {
    evt.headers.append("Set-Cookie", `username=${username}`);
    return { ok: true };
  } else return { ok: false };
});
```

之后可以在任意的 preact 组件中导入 `useLogin` 函数并获得一个 action 的实例。

可以直接放入 `Form` 组件使用，或者自行调用 `.submit(FormData)` 函数。

```jsx
import { useLogin } from "./action.ts";
import { Form } from "@biliblitz/blitz";

// 使用自带的 Form 组件
export function LoginComponent() {
  const login = useLogin();
  const success = () => {
    // 服务器返回 200 状态
    const data = login.data; // ReadonlySignal<T | null>
  };
  const fail = () => {
    // 服务器返回 400/500 状态
    const error = login.error; // ReadonlySignal<Error | null>
  };

  return (
    <Form action={login} onSuccess={success} onFail={fail}>
      <input type="text" name="username" />
      <input type="password" name="password" />
      <button>Log in</button>
    </Form>
  );
}

// 全手动操作
export function LoginManually() {
  const login = useLogin();
  const click = async () => {
    const formData = new FormData();
    formData.set("username", "alice");
    formData.set("password", "alice");
    try {
      await login.submit(formData);
      // 服务器返回 200 状态
      const data = login.data; // ReadonlySignal<T | null>
    } catch (e) {
      // 服务器返回 400/500 状态
      const error = login.error; // ReadonlySignal<Error | null>
    }
  };

  return <button onClick={click}>Log in</button>;
}
```

## 运行流程

对于服务端：

1. 收到 HTTP 请求 `POST /[path]/_data.json?_action=[hash]`；
2. 解析路径 `/[path]/` 是否合法，并分析 `[hash]` 是否有对应的 action，如果未找到返回 400 错误；
3. 创建 evt 对象，依次运行所有的中间件和 action（运行顺序见[中间件#运行顺序](./middlewares.md#运行顺序)）；
4. 运行该 action，获得运行结果数据；
5. 根据路径 `/[path]/` 运行相应的中间件和 loader；
6. 将 action 的数据和所有 loader 的运行结果整理成 json 返回。

对于客户端：

1. 依据当前路径发起 HTTP 请求 `POST /[path]/_data.json?_action=[hash]`；
2. 若返回 200，则解析出 action 结果和新的 loader 结果；
   - 更新 action 实例的 `.data` 属性，清空 `.error` 属性；
   - 更新覆盖所有的 loader 数据。
3. 若返回 400/500，则整理出一个 Error 对象；
   - 清空 action 实例的 `.data` 属性，更新 `.error` 属性。
