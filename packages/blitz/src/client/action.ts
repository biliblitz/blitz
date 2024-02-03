import { batch, useSignal } from "@preact/signals";
import type {
  ActionHandler,
  ActionReturnValue,
  ActionState,
} from "../server/action.ts";
import { useNavigate, useRender } from "./navigate.ts";
import { ActionResponse } from "../server/server.tsx";
import { replaceState } from "./history.ts";

export function useAction<T extends ActionReturnValue>(
  ref: string,
): ActionHandler<T> {
  const render = useRender();
  const navigate = useNavigate();

  const state = useSignal<ActionState>("idle");
  const data = useSignal<T | null>(null);
  const error = useSignal<Error | null>(null);

  const submit = async (formData: FormData) => {
    state.value = "waiting";

    const dataUrl = new URL(location.href);
    if (!dataUrl.pathname.endsWith("/")) {
      dataUrl.pathname += "/";
    }
    dataUrl.hash = "";
    dataUrl.pathname += "_data.json";
    dataUrl.searchParams.set("_action", ref);

    try {
      const response = await fetch(dataUrl, { method: "POST", body: formData });
      const resp = (await response.json()) as ActionResponse<T>;

      if (resp.ok === "action") {
        batch(() => {
          state.value = "ok";
          data.value = resp.action;
          error.value = null;
        });
        replaceState({ loaders: resp.loaders });
        await render(resp.loaders, resp.components);
      } else if (resp.ok === "redirect") {
        await navigate(resp.redirect);
      } else if (resp.ok === "error") {
        throw new Error(resp.error);
      } else {
        throw new Error("Invalid Response");
      }
    } catch (e) {
      batch(() => {
        state.value = "error";
        data.value = null;
        error.value = e instanceof Error ? e : new Error(String(e));
      });
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
