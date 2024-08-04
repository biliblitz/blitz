# static

输出完全静态的文件，可以托管于 GitHub Pages 或者其他类似的服务。

## 引入

首先创建 `adapters/static/vite.config.ts` 文件，写入如下内容。

```js
import { staticAdapter } from "@biliblitz/vite/adapters/static";
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

接着，创建 `src/entry.static.tsx` 文件，作为服务端渲染的入口。

```tsx
import server from "./entry.server.tsx";

export default server;
```

接着，在 `package.json` 中添加构建脚本。

```json
{
  "scripts": {
    "build:static": "vite build --outDir dist/static --ssr -c adapters/static/vite.config.ts"
  }
}
```

最后，可以添加 `server-static.js`，可以在构建完成之后在本地进行预览（可选）。

```js
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";

const app = new Hono();

app.use(serveStatic({ root: "./dist/static/" }));

serve(app, (info) => {
  console.log(`Listening on http://localhost:${info.port}/`);
});
```

并且添加启动预览静态构建的脚本（可选）。

```json
{
  "scripts": {
    "start:static": "node server-static.js"
  }
}
```

## 构建

需要先构建 `build:client`，才可以构建 `build:static`。

```sh
npm run build:client && npm run build:static
```

## 配置

在 `adapters/static/vite.config.ts` 中可以编辑选项。

- `origin` - 目标部署网站的 Host，例如 `https://example.github.io`，**注意结尾没有斜杠（`/`）！**
- `sitemap` - 是否生成 sitemap（默认 true）。

如果你生成了 sitemap，记得编辑 `public/robots.txt`，添加下面的内容，指向生成的 sitemap 文件。

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
