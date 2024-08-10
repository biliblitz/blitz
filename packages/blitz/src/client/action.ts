import type {
  ActionHandler,
  ActionReturnValue,
  ActionState,
} from "../server/action.ts";
import { fetchLoaders } from "./loader.ts";
import type { ActionResponse } from "../server/router.ts";
import { ref as _ref, type Ref } from "vue";
import { useRouter } from "vue-router";
import { useLoaders } from "./runtime.ts";

export async function fetchAction<T>(
  ref: string,
  method: string,
  data: FormData,
) {
  const target = new URL(location.href);
  if (!target.pathname.endsWith("/")) {
    target.pathname += "/";
  }
  target.hash = "";
  target.pathname += "_data.json";
  target.searchParams.set("_action", ref);
  const response = await fetch(target, { method, body: data });
  return (await response.json()) as ActionResponse<T>;
}

export function useAction<T extends ActionReturnValue>(
  ref: string,
  method: string,
): ActionHandler<T> {
  const router = useRouter();
  const store = useLoaders();
  const state = _ref<ActionState<T>>({
    status: "idle",
    data: null,
    error: null,
  }) as Ref<ActionState<T>>;

  const submit = async (formData: FormData) => {
    state.value = { status: "waiting", data: null, error: null };

    try {
      const resp = await fetchAction<T>(ref, method, formData);

      if (resp.ok === "action") {
        state.value = { status: "ok", data: resp.action, error: null };

        const data = await fetchLoaders(location.href);

        if (data.ok === "loader") {
          store.value = new Map([...store.value, ...data.loaders]);
        } else if (data.ok === "redirect") {
          await router.push(data.redirect);
        } else if (data.ok === "error") {
          throw new Error(data.error);
        } else {
          throw new Error("Invalid Response");
        }
      } else if (resp.ok === "redirect") {
        await router.push(resp.redirect);
      } else if (resp.ok === "error") {
        throw new Error(resp.error);
      } else {
        throw new Error("Invalid Response");
      }
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e), { cause: e });
      state.value = { status: "error", data: null, error };
    }
  };

  return {
    ref,
    state,
    method,
    submit,
  };
}
