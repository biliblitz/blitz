export const id = (name: string) => `blitz:${name}`;
export const resolve = (id: string) => `\0${id}`;
export const url = (id: string) => `/@id/__x00__${id}`;

export const manifestId = id("manifest");
