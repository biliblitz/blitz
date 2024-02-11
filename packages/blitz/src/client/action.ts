import type {
  ActionHandler,
  ActionReturnValue,
  ActionState,
} from "../server/action.ts";
import { useNavigate } from "./navigate.ts";
import { ActionResponse } from "../server/server.tsx";
import { useSetRuntime } from "./runtime.ts";
import { nextTick } from "../utils/algorithms.ts";
import { useState } from "preact/hooks";

export function useAction<T extends ActionReturnValue>(
  ref: string,
): ActionHandler<T> {
  const setRuntime = useSetRuntime();
  const navigate = useNavigate();

  const [state, setState] = useState<ActionState<T>>({
    state: "idle",
    data: null,
    error: null,
  });

  const submit = async (formData: FormData) => {
    setState(() => ({ state: "waiting", data: null, error: null }));

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
        setState({ state: "ok", data: resp.action, error: null });

        setRuntime((runtime) => ({
          ...runtime,
          meta: resp.meta,
          params: resp.params,
          loaders: resp.loaders,
          location: new URL(location.href),
          components: resp.components,
        }));

        await nextTick();
      } else if (resp.ok === "redirect") {
        await navigate(resp.redirect);
      } else if (resp.ok === "error") {
        throw new Error(resp.error);
      } else {
        throw new Error("Invalid Response");
      }
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      setState({ state: "error", data: null, error });
    }
  };

  return {
    ref,
    state,
    submit,
  };
}
