import { defineComponent, h, watch } from "vue";
import type { ActionHandler, ActionReturnValue } from "../../server/action.ts";

export const Form = defineComponent({
  name: "Form",
  props: {
    action: {
      type: Object as () => ActionHandler,
      required: true,
    },
  },
  setup(props, { slots }) {
    const submit = (e: Event) => {
      e.preventDefault();
      const formData = new FormData(
        e.currentTarget as HTMLFormElement,
        (e as SubmitEvent).submitter,
      );
      props.action.submit(formData);
    };

    return () =>
      h(
        "form",
        {
          action: `?_action=${props.action.ref}`,
          method: "POST",
          onSubmit: submit,
        },
        slots.default,
      );
  },
});

type WatchActionOptions<T extends ActionReturnValue> = {
  success?: (data: T) => void | (() => void);
  error?: (error: Error) => void | (() => void);
};

export function watchAction<T extends ActionReturnValue>(
  action: ActionHandler<T>,
  options: WatchActionOptions<T>,
) {
  watch(action.state, (state) => {
    if (state.status === "ok") {
      options.success && options.success(state.data);
    } else if (state.status === "error") {
      options.error && options.error(state.error);
    }
  });
}
