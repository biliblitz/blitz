# Loaders

Loader 用来加载渲染页面时需要获取的数据。

## 使用方法

创建 `loader.ts`，然后使用命名导出来定义 loader。

```js
export const useUsername = loader$(async (evt) => {
  if (checkUsername(evt)) {
    return { username: "alice" };
  } else {
    return null;
  }
});
```

同一个 `loader.ts` 文件中的所有 loader 无论是否被使用，在加载其目录下的所有子路由的时候都会被运行。

在该 `loader.ts` 文件所在目录的同级或子目录下的所有 `layout.tsx` 和 `index.tsx` 中都可以随意引用和使用该 loader。

```jsx
import { useUsername } from "./loader.ts";

export default index$(() => {
  /** @type {ReadonlySignal<{ username: string } | null>} */
  const username = useUsername();
  return <div>user: {username.value?.username}</div>;
});
```

## 运行流程

服务端

1. 收到请求 `GET /[path]/_data.json`；
2. 分析 `/[path]/` 是否合法，如果不合法返回 404；
3. 提取出该路径需要加载的所有 middleware 和 loader，以及需要渲染的组件列表；
4. 创建 evt 对象，依次运行所有的 middleware 和 loader（顺序见[中间件#运行顺序](./middlewares.md#运行顺序)），并收集所有的返回结果；
5. 将所有 loader 的结果和组件列表整理成 json 并返回。

客户端

1. 触发路由到 `/[path]/`；
2. 发起请求 `GET /[path]/_data.json`；
3. 若返回结果为 200，则解析其中的所有 loader 结果和组件列表；
4. 根据组件列表替换整个 `<RouterOutlet />` 内部的结构，并更新覆盖 loader 的值。
