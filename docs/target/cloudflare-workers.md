# Cloudflare Workers

Cloudflare Workers 是一项 Web 托管服务，完全使用 JavaScript 处理所有请求。

## 推荐阅读

- [Cloudflare Workers](https://workers.cloudflare.com/)
- [Add static assets to an existing Workers project - Cloudflare Docs](https://developers.cloudflare.com/workers/configuration/sites/start-from-worker/)

## 引入

首先安装新的依赖。

```sh
npm i @cloudflare/kv-asset-handler wrangler
npm i -D @biliblitz/adapter-workers @cloudflare/workers-types
```

之后创建 `adapters/workers/vite.config.ts`，写入以下内容。

```ts
import { workersAdapter } from "@biliblitz/adapter-workers";
import { defineConfig, mergeConfig } from "vite";
import baseConfig from "../../vite.config.ts";

export default mergeConfig(
  baseConfig,
  defineConfig({
    plugins: [workersAdapter()],
  }),
);
```

创建 `src/entry.workers.ts` 文件，作为服务端渲染的入口。

```ts
import type { Env } from "@biliblitz/blitz/server";
import server from "./entry.server.ts";

import { getAssetFromKV } from "@cloudflare/kv-asset-handler";
import manifestJSON from "__STATIC_CONTENT_MANIFEST";
const assetManifest = JSON.parse(manifestJSON);

export default {
  async fetch(req, env, ctx) {
    try {
      return await getAssetFromKV(
        { request: req.clone(), waitUntil: ctx.waitUntil.bind(ctx) },
        {
          ASSET_NAMESPACE: env.__STATIC_CONTENT,
          ASSET_MANIFEST: assetManifest,
        },
      );
    } catch {
      return await server.fetch(req, env, ctx);
    }
  },
} satisfies ExportedHandler<Env>;
```

创建 `src/workers-env.d.ts`，添加一些全局类型声明。

```ts
import type { Env } from "@biliblitz/blitz/server";

declare module "@biliblitz/blitz/server" {
  export interface Env {
    __STATIC_CONTENT: KVNamespace<string>;
  }
}
```

创建 `src/workers-assets.d.ts`，添加如下内容。

```ts
declare module "__STATIC_CONTENT_MANIFEST" {
  declare const x: string;
  export default x;
}
```

创建 `wrangler.toml`，写入以下内容。

```toml
#:schema node_modules/wrangler/config-schema.json
name = "wrangler"
main = "dist/workers/server.js"
compatibility_date = "2024-07-29"
compatibility_flags = ["nodejs_compat"]

[site]
bucket = "./dist/workers/assets"
```

编辑 `vite.config.ts`，添加 `workersDev()` 到插件列表中。

<!-- prettier-ignore -->
```ts
import { workersDev } from "@biliblitz/adapter-workers";

export default defineConfig({
  plugins: [/* ... */, workersDev(), /* ... */],
});
```

编辑 `tsconfig.json`，添加 `@cloudflare/workers-types/2023-07-01` 到 `types` 中。

<!-- prettier-ignore -->
```json
{
  "compilerOptions": {
    "types": [/* ... */, "@cloudflare/workers-types/2023-07-01"]
  }
}
```

最后编辑 `package.json`，添加如下内容。

```json
{
  "scripts": {
    "build:workers": "vite build --ssr -c adapters/workers/vite.config.ts",
    "start": "wrangler dev"
  }
}
```

## 构建

需要先构建 `build:client`，才可以构建 `build:workers`。

```sh
npm run build:client && npm run build:workers
```

## 启动

使用 `npm run start` 启动即可。

```sh
npm run start
```

## 说明

你应该可以在开发环境和生产环境都能够正常使用 cloudflare 的各种功能（例如 KV、D1 等），如果遇到什么非预期的不工作等问题，请及时反馈。
