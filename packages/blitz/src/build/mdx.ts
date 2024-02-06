import { Plugin } from "vite";
import { isMdx } from "../utils/ext.ts";
import { CompileOptions, compile } from "@mdx-js/mdx";
import { VFile } from "vfile";
import { matter } from "vfile-matter";
import { readFile } from "fs/promises";

export function blitzMdx(options?: CompileOptions): Plugin {
  return {
    name: "blitz-mdx",

    async load(id) {
      if (isMdx(id)) {
        const buffer = await readFile(id, "utf8");
        const source = new VFile(buffer);

        matter(source);
        const frontmatter = source.data.matter || {};

        const mdx = await compile(
          source,
          options || { jsxImportSource: "preact" },
        );

        return [toMetaCode(frontmatter), String(mdx)].join("\n");
      }
    },
  };
}

function toMetaCode(frontmatter: {}) {
  return `export const meta = () => {
    return ${JSON.stringify(frontmatter)};
  }`;
}
