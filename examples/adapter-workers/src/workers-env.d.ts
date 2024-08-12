import type { Env } from "@biliblitz/blitz/server";

declare module "@biliblitz/blitz/server" {
  export interface Env {
    __STATIC_CONTENT: KVNamespace<string>;
  }
}
