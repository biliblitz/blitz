# Cloudflare Pages

Cloudflare Pages 是一项 Web 托管服务，可以托管完全静态站点，也可以为特定的路径添加一些处理的脚本。

关于部署静态站点，可以使用 [static](/target/static) 目标。

如果想要启用一些动态的功能，需要自行编写相关逻辑。

## 推荐阅读

> [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/)

## 引入

安装新的依赖。

```sh
npm i -D wrangler @cloudflare/workers-types
```

在 `tsconfig.json` 的 `compilerOptions.types` 中添加该依赖。并且在 `includes` 中添加 `functions`。

```json
{
  "compilerOptions": {
    "types": ["@cloudflare/workers-types"]
  },
  "include": ["functions"]
}
```

在项目的根目录中创建 `functions/api/example.ts`，写入下面内容。

```ts
import type { Env } from "@biliblitz/blitz/server";

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const url = new URL(ctx.request.url);
  return new Response(`Your URL is ${url.href}`);
};
```

运行下面的脚本来将 Pages 的配置信息拷贝下来。（其中 `<name>` 是你在 Pages 上的项目名称）

```sh
npx wrangler pages download config <name>
```

手动检查 `wrangler.toml`，将下面字段改成这个。

```toml
pages_build_output_dir = "dist/static"
```

编辑 `vite.config.ts`，添加对于 `/api/` 的代理。

```ts
export default defineConfig({
  server: {
    proxy: {
      "/api/": "http://localhost:8788/",
    },
  },
});
```

编辑 `package.json`，添加下面的 `scripts`。

```json
{
  "scripts": {
    "dev:pages": "wrangler pages dev"
  }
}
```

## 开发

开发的时候需要启动两个服务。

```sh
npm run dev:pages
npm run dev
```

## 部署

前往 Cloudflare Pages 控制台，链接到 GitHub 仓库即可。
