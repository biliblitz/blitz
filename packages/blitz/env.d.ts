declare module "blitz:manifest/server" {
  export const manifest: import("./dist/types/server/build.d.ts").ServerManifest;
}

declare module "blitz:manifest/client" {
  export const manifest: import("./dist/types/server/build.d.ts").ClientManifest;
}

declare module "blitz:manifest/assets" {
  const assets: string[];
  export default assets;
}
