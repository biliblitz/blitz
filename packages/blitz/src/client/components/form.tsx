import type { JSX } from "preact";
import type { ActionHandler, ActionReturnValue } from "../../server/action.ts";
import { useEffect } from "preact/hooks";

type FormProps<T extends ActionReturnValue> = Omit<
  JSX.HTMLAttributes<HTMLFormElement>,
  "action"
> & {
  action: ActionHandler<T>;
};

export function Form<T extends ActionReturnValue>(props: FormProps<T>) {
  const { action, ...remains } = props;

  return (
    <form
      action={"?_action=" + action.ref}
      method="POST"
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget, e.submitter);
        action.submit(formData);
      }}
      {...remains}
    />
  );
}

type ActionEffect<T extends ActionReturnValue> = {
  action: ActionHandler<T>;
  success?: (data: T) => void | (() => void);
  error?: (error: Error) => void | (() => void);
};

export function useActionEffect<T extends ActionReturnValue>({
  action,
  success,
  error,
}: ActionEffect<T>) {
  useEffect(() => {
    if (action.state.state === "ok" && success) {
      return success(action.state.data);
    } else if (action.state.state === "error" && error) {
      return error(action.state.error);
    }
  }, [action.state]);
}
