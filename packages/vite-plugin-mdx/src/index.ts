import type { Plugin } from "vite";
import { compile, type CompileOptions } from "@mdx-js/mdx";
import { VFile } from "vfile";
import { matter } from "vfile-matter";

type FrontMatter = {
  title?: string;
  description?: string;
};

const isMdx = (x: string) => /\.mdx?$/.test(x.split("?")[0]);

export function blitzMdx(options?: CompileOptions): Plugin {
  options ??= {};
  options.jsxImportSource ??= "vue";
  options.elementAttributeNameCase = "html";

  return {
    name: "blitz-mdx",

    shouldTransformCachedModule(options) {
      if (isMdx(options.id)) {
        return false;
      }
    },

    async transform(code, id) {
      if (isMdx(id)) {
        const source = new VFile(code);

        matter(source, { strip: true });
        const frontmatter = (source.data.matter || {}) as FrontMatter;

        const mdx = String(
          await compile(source, {
            ...options,
            format: id.endsWith("x") ? "mdx" : "md",
            outputFormat: "program",
          }),
        ).split("\n");

        // find inject point
        const index = mdx.indexOf(
          "export default function MDXContent(props = {}) {",
        );
        if (index > -1) {
          mdx.length = index;
          mdx.unshift(
            `const title = ${JSON.stringify(frontmatter.title || "")};`,
            `const description = ${JSON.stringify(frontmatter.description || "")};`,
          );
          mdx.push(
            `import { h as _h } from "vue";`,
            `import { useHead as _useHead } from "@unhead/vue";`,
            `export default {`,
            `  props: ["components"],`,
            `  setup(props) {`,
            `    _useHead({ title, description });`,
            `    const { wrapper: MDXLayout } = props.components || {};`,
            `    return MDXLayout`,
            `      ? () => _h(MDXLayout, props, () => _createMdxContent(props))`,
            `      : () => _createMdxContent(props);`,
            `  },`,
            `};`,
          );
        }

        return { code: mdx.join("\n") };
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
