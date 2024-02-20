import { JSX } from "preact";
import { ActionHandler, ActionReturnValue } from "../../server/action.ts";
import { useEffect } from "preact/hooks";

type FormProps<T extends ActionReturnValue> = Omit<
  JSX.HTMLAttributes<HTMLFormElement>,
  "action" | "onSuccess" | "onError"
> & {
  action: ActionHandler<T>;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
};

export function Form<T extends ActionReturnValue>(props: FormProps<T>) {
  const { action, onSuccess, onError, ...remains } = props;

  // register callbacks
  useEffect(() => {
    if (action.state.state === "ok" && onSuccess) {
      onSuccess(action.state.data);
    } else if (action.state.state === "error" && onError) {
      onError(action.state.error);
    }
  }, [action.state]);

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

export function useActionSuccess<T extends ActionReturnValue>(
  effect: (data: T) => void | (() => void),
  action: ActionHandler<T>,
) {
  useEffect(() => {
    if (action.state.state === "ok") {
      return effect(action.state.data);
    }
  }, [action.state]);
}

export function useActionError<T extends ActionReturnValue>(
  effect: (data: Error) => void | (() => void),
  action: ActionHandler<T>,
) {
  useEffect(() => {
    if (action.state.state === "error") {
      return effect(action.state.error);
    }
  }, [action.state]);
}
