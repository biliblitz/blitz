import type { Plugin } from "vite";
import MarkdownIt, { type PluginWithOptions } from "markdown-it";
import { sfcPlugin } from "@mdit-vue/plugin-sfc";
import type { MarkdownItEnv } from "@mdit-vue/types";
import { frontmatterPlugin } from "@mdit-vue/plugin-frontmatter";
import { componentPlugin } from "@mdit-vue/plugin-component";

type PluginPair<T = any> = [PluginWithOptions<T>, T] | [PluginWithOptions<T>];

export type MditOptions = {
  include?: (string | RegExp)[];
  exclude?: (string | RegExp)[];
  plugins?: PluginPair[];
};

const onlypath =
  <T>(fn: (x: string) => T) =>
  (id: string) =>
    fn(id.split("?")[0]);
const matches = (x: string | RegExp, id: string) =>
  typeof x === "string" ? id.includes(x) : x.test(id);

export function mdit(options: MditOptions = {}): Plugin {
  const include = options.include ?? [/\.md$/];
  const exclude = options.exclude ?? [];
  const includes = onlypath((id) => include.some((x) => matches(x, id)));
  const excludes = onlypath((id) => exclude.some((x) => matches(x, id)));

  const md = MarkdownIt({ html: true });
  md.use(frontmatterPlugin);
  md.use(componentPlugin);
  for (const [plugin, opts] of options?.plugins || []) {
    md.use(plugin, opts);
  }
  md.use(sfcPlugin);

  return {
    name: "blitz:mdit",

    shouldTransformCachedModule(options) {
      if (includes(options.id) && !excludes(options.id)) {
        return false;
      }
    },

    async transform(code, id) {
      if (includes(id) && !excludes(id)) {
        const env: MarkdownItEnv = {};

        md.render(code, env);

        const vue = [
          `<script>
            const frontmatter = ${JSON.stringify(env.frontmatter).replaceAll("/", "\\/")};
            const title = frontmatter.title ?? "";
            const description = frontmatter.description ?? "";
          </script>`,
          `<script setup>
            import { useHead as _useHead } from "@unhead/vue";
            _useHead({ title, meta: [{ name: "description", content: description }] });
          </script>`,
          ...(env.sfcBlocks?.scripts.map((x) => x.content) ?? []),
          ...(env.sfcBlocks?.styles.map((x) => x.content) ?? []),
          env.sfcBlocks?.template?.content ?? "",
        ].join("\n");

        return { code: vue };
      }
    },
  };
}
