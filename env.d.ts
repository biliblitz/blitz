/// <reference types="vite/client" />

declare module "blitz:manifest/server" {
  export const manifest: import("./dist/types/utils/manifest.d.ts").ServerManifest;
}

declare module "blitz:manifest/client" {
  export const manifest: import("./dist/types/utils/manifest.d.ts").ClientManifest;
}
