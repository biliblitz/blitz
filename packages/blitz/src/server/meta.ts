import { JSX } from "preact/jsx-runtime";
import { FetchEvent } from "./event.ts";

export type Meta = {
  title: string;
  description: string;
  meta: DocumentMeta[];
  link: DocumentLink[];
};
export type MetaFunction = (
  evt: FetchEvent,
) => Partial<Meta> | Promise<Partial<Meta>>;

export type DocumentMeta = JSX.HTMLAttributes<HTMLMetaElement>;
export type DocumentLink = JSX.HTMLAttributes<HTMLLinkElement>;

export function meta$(meta: MetaFunction) {
  return meta;
}

export function createDefaultMeta(): Meta {
  return { title: "untitled", description: "", meta: [], link: [] };
}

export function mergeMeta(origin: Meta, update: Partial<Meta>) {
  origin.title = update.title || origin.title;
  origin.description = update.description || origin.description;
  origin.meta.push(...(update.meta || []));
  origin.link.push(...(update.link || []));
}
