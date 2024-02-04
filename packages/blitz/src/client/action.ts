import { batch, useSignal } from "@preact/signals";
import type {
  ActionHandler,
  ActionReturnValue,
  ActionState,
} from "../server/action.ts";
import { useNavigate } from "./navigate.ts";
import { ActionResponse } from "../server/server.tsx";
import { replaceState } from "./history.ts";
import { useRuntime } from "./runtime.ts";
import { nextTick } from "../utils/algorithms.ts";

export function useAction<T extends ActionReturnValue>(
  ref: string,
): ActionHandler<T> {
  const runtime = useRuntime();
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
        replaceState({
          meta: resp.meta,
          params: resp.params,
          loaders: resp.loaders,
        });
        batch(() => {
          // action signals
          state.value = "ok";
          data.value = resp.action;
          error.value = null;
          // runtime signals
          runtime.meta.value = resp.meta;
          runtime.params.value = resp.params;
          runtime.loaders.value = resp.loaders;
          runtime.location.value = new URL(location.href);
        });
        await nextTick();
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
