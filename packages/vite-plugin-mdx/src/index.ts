import type { Plugin } from "vite";
import { compile, type CompileOptions } from "@mdx-js/mdx";
import { VFile } from "vfile";
import { matter } from "vfile-matter";

type FrontMatter = {
  title?: string;
  description?: string;
};

const isMdx = (x: string) => /\.mdx?$/.test(x);

export function blitzMdx(options?: CompileOptions): Plugin {
  options ??= {};
  options.jsxImportSource ??= "vue";

  return {
    name: "blitz-mdx",

    load(id) {
      if (isMdx(id)) {
        return id;
      }
    },

    async transform(code, id) {
      if (isMdx(id)) {
        const source = new VFile(code);

        matter(source, { strip: true });
        const frontmatter = source.data.matter || {};

        const mdx = await compile(source, options);

        return [toMetaCode(frontmatter), String(mdx)].join("\n");
      }
    },
  };
}

function toMetaCode(frontmatter: FrontMatter) {
  return [
    `const title = ${JSON.stringify(frontmatter.title || "")};`,
    `const description = ${JSON.stringify(frontmatter.description || "")};`,
    `export const meta = (_ctx, meta) => {
      meta.title = title;
      meta.description = description;
    }`,
  ].join("\n");
}
