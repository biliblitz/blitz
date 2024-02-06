import { Form, Link } from "@biliblitz/blitz";
import { loader$ } from "@biliblitz/blitz/server";
import { useComputed, useSignal } from "@preact/signals";
import { useLogin } from "./layout.tsx";

export const useUsername = loader$(() => {
  return { username: `alice ${Math.random()}` };
});

export default () => {
  const user = useUsername();
  const username = useComputed(() => user.value.username);
  const count = useSignal(0);

  const login = useLogin();
  const data = useComputed(() => JSON.stringify(login.data.value));
  const error = useComputed(() => login.error.value?.message);
  const state = useComputed(() => login.state.value);

  return (
    <div>
      <h2 onClick={() => count.value++}>
        Index: {username} - {count}
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
