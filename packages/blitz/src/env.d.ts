declare module "blitz:manifest/server" {
  export const manifest: import("./server/build.ts").ServerManifest;
}

declare module "blitz:manifest/client" {
  export const manifest: import("./server/build.ts").ClientManifest;
}

declare module "blitz:manifest/assets" {
  const assets: string[];
  export default assets;
}
