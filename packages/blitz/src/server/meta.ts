import { JSX } from "preact/jsx-runtime";
import { Context } from "hono";

export type Meta = {
  title: string;
  description: string;
  meta: DocumentMeta[];
  link: DocumentLink[];
};
export type MetaFunction = (c: Context, prev: Meta) => void;

export type DocumentMeta = JSX.HTMLAttributes<HTMLMetaElement>;
export type DocumentLink = JSX.HTMLAttributes<HTMLLinkElement>;

export function meta$(meta: MetaFunction) {
  return meta;
}

export function createDefaultMeta(): Meta {
  return { title: "", description: "", meta: [], link: [] };
}
