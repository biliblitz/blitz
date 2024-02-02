import { Form, Link } from "@biliblitz/blitz";
import { useUsername } from "./loader.ts";
import { useComputed, useSignal } from "@preact/signals";
import { useLogin } from "./action.ts";

export default () => {
  const user = useUsername();
  const username = useComputed(() => user.value.username);
  const count = useSignal(0);

  const login = useLogin();
  const data = useComputed(() => JSON.stringify(login.data.value));

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
        <div>data = {data}</div>
        <button>submit</button>
      </Form>
    </div>
  );
};
