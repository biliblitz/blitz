# 中间件

中间件和 Hono 的中间件使用方式基本一致，可以非常灵活地加入到项目中。

- 使用 `middleware$` 可以合并多个中间件（或者用来类型定义）；
- 命名导出到 `middleware` 可以将该中间件应用到整个文件和下级目录中；
- 你可以在 `loader$` 和 `action$` 的前面添加上若干自定义的中间件。

## 示例

<!-- prettier-ignore -->
```ts
const auth = middleware$(async (c, next) => {
  if (!(await hasAccess(c))) {
    throw new HTTPException(403, { message: "Permission Denied" });
  }

  await next();
});

const useUsername = loader$(auth, async (c) => {
  // we run this after auth
  return { /* ... */ };
});

const setCookie = middleware$(/* ... */);
// export to middleware can make it apply to every loader/action inside the scope.
export const middleware = middleware$(auth, setCookie)
```

## 运行顺序

假设匹配到了 `/foo/bar/index.xxx` 页面。

对于 GET 请求：

- `/layout.xxx` 中导出的中间件
- `/layout.xxx` 中的所有 Loader 和其配套中间件
- `/foo/layout.xxx` 中导出的中间件
- `/foo/layout.xxx` 中的所有 Loader 和其配套中间件
- `/foo/bar/layout.xxx` 中导出的中间件
- `/foo/bar/layout.xxx` 中的所有 Loader 和其配套中间件
- `/foo/bar/index.xxx` 中导出的中间件
- `/foo/bar/index.xxx` 中的所有 Loader 和其配套中间件
- 返回数据

对于 POST / DELETE / PATCH / PUT 请求：

- `/layout.xxx` 中导出的中间件
- `/foo/layout.xxx` 中导出的中间件
- `/foo/bar/layout.xxx` 中导出的中间件
- `/foo/bar/index.xxx` 中导出的中间件
- `/foo/bar/index.xxx` 中匹配的 Action 和其配套中间件
- 返回数据
