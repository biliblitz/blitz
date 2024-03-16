import { HTTPException } from "hono/http-exception";
import { RedirectStatusCode } from "hono/utils/http-status";

export class RedirectException extends Error {
  readonly target: string | URL;
  readonly status: RedirectStatusCode;

  constructor(target: string | URL, status: RedirectStatusCode = 307) {
    super();

    this.target = target;
    this.status = status;
  }
}

export { HTTPException };
