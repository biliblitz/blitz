import { Form, useActionEffect } from "@biliblitz/blitz";
import { action$ } from "@biliblitz/blitz/server";
import { useEffect, useRef } from "preact/hooks";

export const useRandom = action$(async (c) => {
  const formData = await c.req.formData();
  const mode = formData.get("mode");

  switch (mode) {
    case "redirect":
      throw new URL("/", c.req.url);
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

  // 注册失败回调
  useEffect(() => {
    if (action.state.state === "error") {
      console.log(`error: "${action.state.error.message}" from useEffect`);
    }
  }, [action.state]);

  // 或者使用包装的钩子函数
  useActionEffect({
    action,
    success(data) {
      console.log(`ok: "${data.ok}" from useActionEffect`);
    },
    error(error) {
      console.log(`error: "${error.message}" from useActionEffect`);
    },
  });

  // 如果你想要成功之后重置 form
  const form = useRef<HTMLFormElement>(null);
  useActionEffect({ action, success: () => form.current?.reset() });

  return (
    <Form
      action={action}
      // 或者直接写在这里
      onSuccess={(data) => {
        console.log(`ok: "${data.ok}" from <Form />`);
      }}
      // 同样的失败回调
      onError={(error) => {
        console.log(`error: "${error.message}" from <Form />`);
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
