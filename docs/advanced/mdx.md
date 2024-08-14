# Markdown & MDX

MDX 是将 Markdown 文档编译成 JS 文件的技术。

在 Blitz 中，`index.xxx` 和 `layout.xxx` 部分可以使用 Markdown 进行编写。

目前 Blitz 有三套将 Markdown 编译成 JS 的方案，取决于你喜欢哪一种。

| 方案名称 | Markdown 编译器           | 编译目标 |
| -------- | ------------------------- | -------- |
| mdx      | unified (remark + rehype) | JSX      |
| mdit     | markdown-it               | Vue SFC  |
| markdown | unified (remark + rehype) | Vue SFC  |

## 方案 mdx

[MDX](https://mdxjs.com/) 是将 Markdown 文件编译成任意支持 JSX 的前端框架的方案，基于 unified 全家桶。

由于 Vue 对于 JSX 的支持并不是很好，这种方案虽然能用，但是会让 Vue 抛出一大堆 warning，**不太建议使用**。

此外，最好不要搭配 `@vitejs/plugin-vue-jsx` 插件，除非你能忍受巨慢无比的编译速度。

### 安装

添加新的依赖。

```sh
npm i -D @biliblitz/vite-plugin-mdx
```

编辑 `vite.config.ts`，写入以下内容

<!-- prettier-ignore -->
```js
import { mdx } from "@biliblitz/vite-plugin-mdx";

export default defineConfig({
  plugins: [
    /* ... */
    mdx({
      jsxImportSource: "vue",
      remarkPlugins: [/* remark plugins */],
      rehypePlugins: [/* rehype plugins */],
    }),
    /* 记得放在 blitz 前面 */
    blitz(),
    /* ... */
  ],
  /* ... */
});
```

创建 `index.mdx` 或者 `layout.mdx`，然后写入以下内容

```md
---
title: Welcome page
---

# {title}

**Hello** _world_!!!
```

重启 `vite` 服务器，或者重新构建即可看到效果。

## 方案 mdit

使用基于 [`@mdit-vue`](https://github.com/mdit-vue/mdit-vue) 全家桶的 Markdown 到 Vue SFC 的编译方案。

这套方案对于 Vue 兼容比较完善，基本可以稳定使用，**较为推荐**。

### 安装

添加新的依赖。

```sh
npm i -D @biliblitz/vite-plugin-mdit
```

编辑 `vite.config.ts`，写入以下内容

<!-- prettier-ignore -->
```js
import vue from "@vitejs/plugin-vue";
import { mdit } from "@biliblitz/vite-plugin-mdit";

export default defineConfig({
  plugins: [
    /* 记得放在 vue 和 blitz 前面 */
    mdit({ plugins: [/* ... */] }),
    /* vue 插件需要添加额外参数 */
    vue({ include: [ /\.vue$/, /\.md$/ ] }),
    blitz(),
    /* ... */
  ],
  /* ... */
});
```

创建 `index.md` 或者 `layout.md`，然后写入以下内容

```md
---
title: Welcome page
---

# {{ title }}

**Hello** _world_!!!
```

重启 `vite` 服务器，或者重新构建即可看到效果。

## 方案 markdown

这套方案是参考 [`rehype-vue-sfc`](https://github.com/antfu/rehype-vue-sfc) 项目，基于 unified 全家桶，将 Markdown 文件编译成 Vue SFC 的实现。

该方案因为比较原始，可能会遇到一些奇奇怪怪的问题，需要用户自己具备调试 unified 全家桶的能力。如果你觉得这没有问题，这将会是不错的一套解决方案。

### 安装

添加新的依赖。

```sh
npm i -D @biliblitz/vite-plugin-markdown
```

编辑 `vite.config.ts`，写入以下内容

<!-- prettier-ignore -->
```js
import vue from "@vitejs/plugin-vue";
import { markdown } from "@biliblitz/vite-plugin-markdown";

export default defineConfig({
  plugins: [
    /* 记得放在 vue 和 blitz 前面 */
    markdown({
      remarkPlugins: [/* ... */],
      rehypePlugins: [/* ... */],
      remarkRehypeOptions: { /* ... */ },
    }),
    /* vue 插件需要添加额外参数 */
    vue({ include: [ /\.vue$/, /\.md$/ ] }),
    blitz(),
    /* ... */
  ],
  /* ... */
});
```

创建 `index.md` 或者 `layout.md`，然后写入以下内容

```md
---
title: Welcome page
---

# {{ title }}

**Hello** _world_!!!
```

重启 `vite` 服务器，或者重新构建即可看到效果。

## 常用 unified 插件

因为我记性比较差，所以我把我用过的东西丢在这里。

### KaTeX

有时候需要支持数学公式，可以使用 `remark-math` 和 `rehype-katex`。

```bash
npm i -D remark-math rehype-katex katex
```

之后可能需要手动干预 katex 版本，因为 `rehype-katex` 依赖的 `katex` 版本可能跟手动安装的版本不同。

编辑 `package.json`，添加 `resolutions` 字段，写入你希望统一的 `katex` 版本。

```jsonc
{
  /* ... */
  "resolutions": {
    "katex": "^0.16.9",
  },
}
```

之后使用 `npm install` 同步即可。

```bash
npm install
```

完成之后编辑 `vite.config.ts`，分别添加 `remark-math` 和 `rehype-katex` 插件。

```jsx
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

export default defineConfig({
  plugins: [
    /* ... */
    markdown({
      /* ... */
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex],
    }),
  ],
});
```

最后编辑 `src/Root.vue`，在最开始引入 `katex` 的样式文件即可。

```jsx
import "katex/dist/katex.min.css";
```

### 代码高亮 (Prism)

代码高亮可以使用 `rehype-prism-plus` 插件。

首先安装 `rehype-prism-plus` 模块。

```bash
npm i -D rehype-prism-plus prismjs
```

之后编辑 `vite.config.ts`，添加该插件，同时写入配置信息。

```jsx
import rehypePrism from "rehype-prism-plus";

export default defineConfig({
  plugins: [
    /* ... */
    blitzMdx({
      /* ... */
      rehypePlugins: [[rehypePrism, { ignoreMissing: true }]],
    }),
  ],
});
```

然后编辑 `app/root.tsx`，引入 `prismjs` 所需要的样式即可。

```jsx
import "prismjs/themes/prism-[theme].min.css";
```

如果你要支持 `rehype-prism-plus` 所提供的高亮代码行的功能，可能需要自行编写样式。

### 代码高亮 (Shiki)

[Shiki](https://shiki.style/) 是一个新的语法高亮工具，体验上比一些老掉牙的东西应该会好很多。

分别提供 `markdown-it` 和 `rehype` 的插件，查看文档自己安装即可。
