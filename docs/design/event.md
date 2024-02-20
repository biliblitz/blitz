# FetchEvent

FetchEvent 是一个可以在 `loader`、`action` 以及 `middleware` 中使用的参数类型。

所有 Loader、Action 和 Middleware 在运行的时候都会传入一个 FetchEvent 对象，对象中包含了对该次请求的 Request 对象和其他相关的接口。

## API

### `FetchEvent.request: Request`

来获取请求的 Request 对象。

### `FetchEvent.params: Map<string, string>`

路由中获取的参数。

### `FetchEvent.headers: Headers`

用于在响应中添加 HTTP 头。

### `FetchEvent.status(status: number): void`

用于设置响应的 status（仅对 SSR 有效）。

### `FetchEvent.resolve(reference: Loader<T> | Middleware<T>): T;`

用于获取其他 Loader 或者 Middleware 运行的结果。

注意只能获取之前运行过的 Loader 和 Middleware。如果引用的对象还未运行，则会抛出一个运行时错误。

关于运行的顺序，可以参考[运行顺序](#)。
