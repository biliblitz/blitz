import { JSX } from "preact/jsx-runtime";
import { Context } from "hono";

export type Meta = {
  title: string;
  description: string;
  meta: DocumentMeta[];
  link: DocumentLink[];
};
export type MetaFunction = (
  c: Context,
) => Partial<Meta> | Promise<Partial<Meta>>;

export type DocumentMeta = JSX.HTMLAttributes<HTMLMetaElement>;
export type DocumentLink = JSX.HTMLAttributes<HTMLLinkElement>;

export function meta$(meta: MetaFunction) {
  return meta;
}

export function createDefaultMeta(): Meta {
  return { title: "untitled", description: "", meta: [], link: [] };
}

export function updateMeta(origin: Meta, update: Partial<Meta>) {
  origin.title = update.title || origin.title;
  origin.description = update.description || origin.description;
  origin.meta.push(...(update.meta || []));
  origin.link.push(...(update.link || []));
}
