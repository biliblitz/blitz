# Loader

Loader 用于获取加载该页面所需的相关数据。

## 简述

- Loader 仅可以声明于 `app/routes` 文件夹下的 `index.tsx` 或者 `layout.tsx` 文件中；
- 使用 `loader$` 函数进行定义，该函数会返回一个钩子函数用于在组件中引用这份数据；
- 定义的所有 Loader 必须从该文件中导出；

## 示例

```tsx
import { loader$ } from "@biliblitz/blitz/server";

// 使用 loader$ 进行定义，函数会传入一个 FetchEvent 对象
// 这部分代码只会在服务端运行
export const useUsername = loader$(async (evt: FetchEvent) => {
  // 可以使用异步接口编写后端代码
  const user = await db.findUser({ id: 114514 });

  // 最后直接返回一个可以 JSON.stringify 的对象即可
  // 如果没有数据则应当返回 null 作为填充
  return { username: user.name };
});

// 前端渲染部分
export default () => {
  // 引用钩子函数获取 loader 在服务端运行的结果
  const username = useUsername(); // { username: string }

  return <div>Hello {username.value.username}!</div>;
};
```
