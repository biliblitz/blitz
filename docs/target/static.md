# static

输出完全静态的文件，可以托管于 GitHub Pages 或者其他类似的服务。

## 引入

首先安装新的依赖。

```sh
npm i -D @biliblitz/adapter-static
```

之后创建 `adapters/static/vite.config.ts` 文件，写入如下内容。

```js
import { staticAdapter } from "@biliblitz/adapter-static";
import { defineConfig, mergeConfig } from "vite";
import baseConfig from "../../vite.config.ts";

export default mergeConfig(
  baseConfig,
  defineConfig({
    plugins: [
      staticAdapter({
        origin: "https://yoursite.blitz.com",
        sitemap: true,
      }),
    ],
  }),
);
```

创建 `src/entry.static.tsx` 文件，作为服务端渲染的入口。

```tsx
import server from "./entry.server.tsx";

export default server;
```

接着，在 `package.json` 中添加构建脚本。

```json
{
  "scripts": {
    "build:static": "vite build --ssr -c adapters/static/vite.config.ts"
  }
}
```

## 构建

需要先构建 `build:client`，才可以构建 `build:static`。

```sh
npm run build:client && npm run build:static
```

## 启动

因为是静态文件，直接使用你喜欢的工具启动就好了。

```sh
# 最简单粗暴
python -m http.server -d ./dist/static -b "::"
# 如果你真的很喜欢 nodejs
npx serve ./dist/static
```

## 配置

在 `adapters/static/vite.config.ts` 中可以编辑选项。

- `origin` - 目标部署网站的 Host，例如 `https://example.github.io`，**注意结尾没有斜杠（`/`）！**
- `sitemap` - 是否生成 sitemap（默认 `true`）。

如果你生成了 sitemap，记得编辑 `public/robots.txt`，添加下面的内容，指向生成的 sitemap 文件。这样谷歌等搜索引擎才会正常工作。

```
User-agent: *
Sitemap: https://example.github.io/sitemap.xml
```

## 常见问题

### 子路径部署

假设你希望将网站部署在子路径下（例如 `https://xxx.github.io/project/`，这对于 GitHub Pages 来说比较常见），你可以在 `adapters/static/vite.config.ts` 的 config 中添加 `base` 属性。

<!-- prettier-ignore -->
```ts
export default mergeConfig(
  baseConfig,
  defineConfig({
    base: '/project/',
    plugins: [
      staticAdapter({ /* ... */ }),
    ],
  }),
);
```

一般来说体验应该会和开发环境一致，如果你有遇到什么问题，可以及时反馈。
