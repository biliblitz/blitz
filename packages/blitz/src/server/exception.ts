import { HTTPException } from "hono/http-exception";

export class RedirectException extends Error {
  constructor(
    public target: string | URL,
    public status: 301 | 302 | 307 | 308 = 307,
  ) {
    super();
  }

  getResponse(base: string): Response {
    const url =
      typeof this.target === "string"
        ? new URL(this.target, base)
        : this.target;
    return new Response(null, {
      status: this.status,
      headers: {
        Location: url.href,
      },
    });
  }
}

export { HTTPException };
