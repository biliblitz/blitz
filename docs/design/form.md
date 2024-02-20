# Form

Form 用来方便调用 action。

你有三种方式监听 action 的提交数据变化和错误处理。

```tsx
import { Form, useActionError, useActionSuccess } from "@biliblitz/blitz";
import { action$ } from "@biliblitz/blitz/server";
import { useEffect, useRef } from "preact/hooks";

export const useRandom = action$(async (evt) => {
  const formData = await evt.request.formData();
  const mode = formData.get("mode");

  switch (mode) {
    case "redirect":
      throw new URL("/", evt.request.url);
    case "throw":
      throw new Error("error from server");
    default:
      return { ok: Math.random() };
  }
});

export default () => {
  const action = useRandom();

  // 注册成功回调
  useEffect(() => {
    if (action.state.state === "ok") {
      console.log(`ok: "${action.state.data.ok}" from useEffect`);
    }
  }, [action.state]);
  // 或者使用包装的钩子函数
  useActionSuccess((data) => {
    console.log(`ok: "${data.ok}" from useActionSuccess`);
  }, action);

  // 同样的失败钩子
  useEffect(() => {
    if (action.state.state === "error") {
      console.log(`error: "${action.state.error.message}" from useEffect`);
    }
  }, [action.state]);
  // 或者使用包装的钩子函数
  useActionError((error) => {
    console.log(`error: "${error.message}" from useActionError`);
  }, action);

  // 如果你想要成功之后重置 form
  const form = useRef<HTMLFormElement>(null);
  useActionSuccess(() => {
    form.current?.reset();
  }, action);

  return (
    <Form
      action={action}
      // 或者直接写在这里
      onSuccess={(data) => {
        console.log(`ok: "${data.ok}" from onSuccess`);
      }}
      // 同样的失败回调
      onError={(error) => {
        console.log(`error: "${error.message}" from onError`);
      }}
    >
      <button name="mode" value="throw">
        Throw
      </button>
      <button name="mode" value="redirect">
        Redirect
      </button>
      <button name="mode" value="normal">
        Normal
      </button>
    </Form>
  );
};
```
