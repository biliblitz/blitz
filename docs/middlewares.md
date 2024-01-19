# 中间件

中间件是用于运行该目录下所有 loader/action 之前的一个通用中间函数。

可以定义在三个地方，分别是 `middleware.ts` 的默认导出、`loader.ts` 的默认导出，以及 `action.ts` 的默认导出。

其中 `middleware.ts` 中定义的 middleware 会同时影响目录下所有的 loader/action，其他两种方式均只影响当前文件内的其他函数。

## 运行顺序

以访问 `GET /[path]/` 为例，所有 loader 和 middleware 的运行顺序为：

- `/middleware.ts` 默认导出；
- `/loader.ts` 默认导出；
- `/loader.ts` 中的其他命名导出（运行顺序不确定）；
- `/[path]/middleware.ts` 默认导出；
- `/[path]/loader.ts` 默认导出；
- `/[path]/loader.ts` 中的其他命名导出（运行顺序不确定）。

以访问 `POST /[path]/_data.json?_action=[hash]` 为例，所有 action 和 middleware 的运行顺序如下：

- `/middleware.ts` 默认导出；
- `/[path]/middleware.ts` 默认导出；
- `/[path]/action.ts` 默认导出；
- `/[path]/action.ts` 中与 `[hash]` 对应的导出函数。

由于错误处理的需要，对于一个请求不会同时并发运行多个 loader，但是同一个文件之内的 loader 运行的顺序是不确定的。
