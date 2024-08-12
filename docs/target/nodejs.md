# nodejs

以 nodejs 为目标编译服务端脚本。

## 引入

首先安装新的依赖。

```sh
npm i hono @hono/node-server
npm i -D @biliblitz/adapter-nodejs
```

之后创建 `adapters/nodejs/vite.config.ts`，写入以下内容。

```ts
import { nodejsAdapter } from "@biliblitz/adapter-nodejs";
import { defineConfig, mergeConfig } from "vite";
import baseConfig from "../../vite.config.ts";

export default mergeConfig(
  baseConfig,
  defineConfig({
    plugins: [nodejsAdapter()],
  }),
);
```

创建 `src/entry.nodejs.ts` 文件，作为服务端渲染的入口。

```ts
import server from "./entry.server.ts";

export default server;
```

创建 `server.js`，写入以下内容。

```js
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";

import server from "./dist/nodejs/server.js";

const app = new Hono();

app.use(serveStatic({ root: "./public/" }));
app.use("/build/*", serveStatic({ root: "./dist/client/" }));
app.route("/", server);

serve(app, (info) => {
  console.log(`Listening on http://localhost:${info.port}/`);
});
```

之后编辑 `package.json`，添加如下内容。

```json
{
  "scripts": {
    "build:nodejs": "vite build --ssr -c adapters/nodejs/vite.config.ts",
    "start": "node server.js"
  }
}
```

## 构建

需要先构建 `build:client`，才可以构建 `build:nodejs`。

```sh
npm run build:client && npm run build:nodejs
```

## 启动

构建完成之后可以使用 `start` 脚本来启动，或者直接跑 `node server.js` 就行。

```sh
npm run start
```
