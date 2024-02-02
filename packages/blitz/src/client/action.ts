import { batch, signal } from "@preact/signals";
import type {
  ActionHandler,
  ActionReturnValue,
  ActionState,
} from "../server/action.ts";
import { useRuntime } from "./runtime.ts";
import { useNavigate, useRender } from "./navigate.ts";
import { ActionResponse } from "../server/server.tsx";
import { replaceState } from "./history.ts";

export function useAction<T extends ActionReturnValue>(
  ref: string,
): ActionHandler<T> {
  const runtime = useRuntime();
  const navigate = useNavigate();
  const render = useRender();
  const state = signal<ActionState>("idle");
  const data = signal<T | null>(null);
  const error = signal<Error | null>(null);
  const submit = async (formData: FormData) => {
    state.value = "waiting";

    const url = new URL(runtime.url.value);
    if (!url.pathname.endsWith("/")) {
      url.pathname += "/";
    }
    url.pathname += "_data.json";
    url.searchParams.set("_action", ref);

    const response = await fetch(url, { method: "POST", body: formData });
    const resp = (await response.json()) as ActionResponse<T>;

    if (resp.ok === "data") {
      batch(() => {
        state.value = "ok";
        data.value = resp.action;
        error.value = null;
      });
      replaceState({ loaders: resp.loaders });
      await render(resp.loaders, resp.components);
    } else if (resp.ok === "error") {
      batch(() => {
        state.value = "error";
        data.value = null;
        error.value = new Error(resp.error);
      });
    } else if (resp.ok === "redirect") {
      await navigate(resp.redirect);
    }
  };

  return {
    ref,
    data,
    error,
    state,
    submit,
  };
}
