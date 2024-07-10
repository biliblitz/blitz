import { Form, Link } from "@biliblitz/blitz";
import { loader$ } from "@biliblitz/blitz/server";
import { useSignal } from "@preact/signals";
import { useLogin } from "./layout.tsx";
import { useMemo } from "preact/hooks";

export const useUsername = loader$(() => {
  return { username: `alice ${Math.random()}` };
});

export const useSomething = loader$(() => {
  return { username: `bob ${Math.random()}` };
});

export default () => {
  const user = useUsername();
  const something = useSomething();

  const count = useSignal(0);

  const login = useLogin();
  const data = useMemo(() => JSON.stringify(login.state.data), [login.state]);
  const error = useMemo(() => login.state.error?.message, [login.state]);
  const state = useMemo(() => login.state.state, [login.state]);

  return (
    <div>
      <h2 onClick={() => count.value++}>
        Index: {user.username} / {something.username} - {count}
      </h2>
      <p>
        <Link href="/foo">/foo</Link>
        <Link href="/bar">/bar</Link>
        <Link href="/foo/#middle">/foo/#middle</Link>
      </p>
      <Form action={login}>
        <div>state = {state}</div>
        <div>data = {data}</div>
        <div>error = {error}</div>
        <button>submit</button>
      </Form>
    </div>
  );
};
