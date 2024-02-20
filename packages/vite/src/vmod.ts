export const id = (name: string) => `blitz:${name}`;
export const resolve = (id: string) => `\0${id}`;
export const url = (id: string) => `/@id/__x00__${id}`;

export const manifestAssets = id("manifest/assets");
export const manifestClient = id("manifest/client");
export const manifestServer = id("manifest/server");

export const staticAdapterId = id("static-adapter");
