# Markdown & MDX

MDX 是将 Markdown 文档编译成 JS 文件的技术。

在 Blitz 中，`index.xxx` 和 `layout.xxx` 部分可以使用 MDX 进行编写。

## 开始

编辑 `vite.config.ts`，写入以下内容

<!-- prettier-ignore -->
```js
import { blitzMdx } from "@biliblitz/vite-plugin-mdx";

export default defineConfig({
  plugins: [
    /* ... */
    blitzMdx({
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

```mdx
---
title: Welcome page
---

# {title}

**Hello** _world_!!!
```

重启 `vite` 服务器，或者重新构建即可看到效果。

## 高级操作

如果你想要将 MDX 文件中的 `<a />` 统一替换成 `<Link />`，或者其他需要替换的 HTML 标签，则可以使用 `@mdx-js/vue` 模块。

首先安装 `@mdx-js/vue` 模块。

```bash
npm i @mdx-js/vue
```

编辑 `vite.config.json`，添加如下内容。

```js
export default defineConfig({
  plugins: [
    /* ... */
    blitzMdx({
      /* ... */
      providerImportSource: "@mdx-js/vue",
    }),
  ],
});
```

接着编辑 `src/Root.vue`，找到 `<router-view />`，在其外层套一个 `<MDXProvider />`。

```vue
<script setup lang="ts">
import { Link } from "~/components/Link.vue";
import { MDXProvider } from "@mdx-js/vue";
// ...
</script>

<template>
  <MDXProvider :components="{ a: Link }">
    <router-view />
  </MDXProvider>
</template>
```

之后，所有 MDX 文件里面的 `a` 标签都会自动换成 `Link` 进行渲染了。

## 常用插件

### GFM

支持更多的 Markdown 语法，比较常用。

首先安装 `remark-gfm` 模块。

```bash
npm i -D remark-gfm
```

之后编辑 `vite.config.ts`，在 `remarkPlugins` 中添加 `remarkGfm`。

```js
import remarkGfm from "remark-gfm";

export default defineConfig({
  plugins: [
    /* ... */
    blitzMdx({
      /* ... */
      remarkPlugins: [remarkGfm],
    }),
  ],
});
```

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
    blitzMdx({
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

### 代码高亮

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
