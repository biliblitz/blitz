import { batch, signal } from "@preact/signals";
import type { ActionHandler, ActionReturnValue } from "../server/action.ts";
import { useRuntime } from "./runtime.ts";

export function useAction<T extends ActionReturnValue>(
  ref: string,
): ActionHandler<T> {
  // TODO

  const runtime = useRuntime();
  const data = signal<T | null>(null);
  const error = signal<Error | null>(null);
  const submit = async (formData: FormData) => {
    const url = new URL(runtime.url.value);
    if (!url.pathname.endsWith("/")) {
      url.pathname += "/";
    }
    url.pathname += "_data.json";
    url.searchParams.set("_action", ref);

    const response = await fetch(url, { method: "POST", body: formData });
    const { action } = await response.json();
    batch(() => {
      data.value = action;
      error.value = null;
    });
    return action;
  };

  return {
    data,
    error,
    submit,
  };
}
