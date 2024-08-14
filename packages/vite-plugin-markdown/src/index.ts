import type { Plugin } from "vite";
import { unified, type PluggableList } from "unified";
import { VFile } from "vfile";
import { matter } from "vfile-matter";
import remarkParse from "remark-parse";
import remarkRehype, { type Options } from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import { rehypeVueSfc } from "./sfc.ts";

export type MarkdownOptions = {
  include?: (string | RegExp)[];
  exclude?: (string | RegExp)[];

  remarkPlugins?: PluggableList;
  rehypePlugins?: PluggableList;
  remarkRehypeOptions?: Options;
};

const onlypath =
  <T>(fn: (x: string) => T) =>
  (id: string) =>
    fn(id.split("?")[0]);
const matches = (x: string | RegExp, id: string) =>
  typeof x === "string" ? id.includes(x) : x.test(id);

export function markdown(options: MarkdownOptions = {}): Plugin {
  const include = options.include ?? [/\.md$/];
  const exclude = options.exclude ?? [];
  const includes = onlypath((id) => include.some((x) => matches(x, id)));
  const excludes = onlypath((id) => exclude.some((x) => matches(x, id)));

  return {
    name: "blitz:markdown",

    shouldTransformCachedModule(options) {
      if (includes(options.id) && !excludes(options.id)) {
        return false;
      }
    },

    async transform(code, id) {
      if (includes(id) && !excludes(id)) {
        const source = new VFile(code);

        matter(source, { strip: true });
        const frontmatter = source.data.matter || {};

        const sfc = await unified()
          .use(remarkParse)
          .use(options.remarkPlugins ?? [])
          .use(remarkRehype, {
            ...options.remarkRehypeOptions,
            allowDangerousHtml: true,
          })
          .use(rehypeRaw)
          .use(options.rehypePlugins ?? [])
          .use(rehypeVueSfc, {
            script: `
              const frontmatter = ${JSON.stringify(frontmatter).replaceAll("/", "\\/")};
              const title = frontmatter.title ?? "";
              const description = frontmatter.description ?? "";
            `,
            scriptSetup: `
              import { useHead as _useHead } from "@unhead/vue";
              _useHead({ title, meta: [{ name: "description", content: description }] });
            `,
          })
          .use(rehypeStringify)
          .process(source);

        return { code: String(sfc) };
      }
    },
  };
}
