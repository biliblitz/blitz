declare module "blitz:manifest/server" {
  export const manifest: import("./server/types.ts").ServerManifest;
}

declare module "blitz:manifest/client" {
  export const manifest: import("./server/types.ts").ClientManifest;
}
