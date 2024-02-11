# Markdown & MDX

MDX 是将 Markdown 文档编译成 JSX 文件的技术，在 blitz 中 index 和 layout 部分可以使用 MDX 进行编写。

## 开始

编辑 `vite.config.ts`，写入以下内容

```js
import { blitzMdx } from "@biliblitz/vite";
export default defineConfig({
  plugins: [
    /* ... */
    blitzMdx({
      remarkPlugins: /* remark plugins */ [],
      rehypePlugins: /* rehype plugins */ [],
      jsxImportSource: "preact",
    }),
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

如果你想要将 MDX 文件中的 `<a />` 统一替换成 `<Link />`，或者其他需要替换的 HTML 标签，则可以使用 `@mdx-js/preact` 模块。

首先安装 `@mdx-js/preact` 模块。

```bash
pnpm add @mdx-js/preact
```

编辑 `vite.config.json`，添加如下内容。

```js
export default defineConfig({
  plugins: [
    /* ... */
    blitzMdx({
      /* ... */
      providerImportSource: "@mdx-js/preact",
    }),
  ],
});
```

接着编辑 `app/root.tsx`，找到 `<RouterOutlet />`，并在其外层添加一个 `<MDXProvider />`。

```jsx
import { Link } from "@biliblitz/blitz";

export default () => {
  return (
    <BlitzCityProvider lang="en">
      <head>{/* ... */}</head>
      <body>
        <MDXProvider components={{ a: Link }}>
          <RouterOutlet />
        </MDXProvider>
      </body>
    </BlitzCityProvider>
  );
};
```

之后重新启动 `vite` 服务器，或者重新构建即可。

## 常用插件

### GFM

支持更多的 Markdown 语法，比较常用。

首先安装 `remark-gfm` 模块。

```bash
pnpm add -D remark-gfm
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
pnpm add -D remark-math rehype-katex katex
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

之后使用 `pnpm install` 同步即可。

```bash
pnpm install
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

最后编辑 `app/root.tsx`，在最开始引入 `katex` 的样式文件即可。

```jsx
import "katex/dist/katex.min.css";
```

### 代码高亮

代码高亮可以使用 `rehype-prism-plus` 插件。

首先安装 `rehype-prism-plus` 模块。

```bash
pnpm add -D rehype-prism-plus prismjs
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
