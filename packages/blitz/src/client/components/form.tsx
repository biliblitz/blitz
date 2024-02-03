import { JSX } from "preact";
import { ActionHandler } from "../../server/action.ts";

type FormProps = Omit<JSX.HTMLAttributes<HTMLFormElement>, "action"> & {
  action: ActionHandler;
};

export function Form(props: FormProps) {
  const { action, ...remains } = props;

  return (
    <form
      action={"?_action=" + action.ref}
      method="POST"
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        action.submit(formData);
      }}
      {...remains}
    />
  );
}
