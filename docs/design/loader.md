# Loader

Loader 用于获取加载该页面所需的相关数据。

## 简述

- Loader 仅可以声明于 `src/routes` 文件夹下的 `index.xxx` 或者 `layout.xxx` 文件中；
- 使用 `loader$` 函数进行定义，该函数会返回一个钩子函数用于在组件中引用这份数据；
- 请不要修改 `loader$` 的名称，编译器魔法会检查这个标识符来寻找 Loader；
- 定义的所有 Loader 必须从该文件中导出；

## 示例

```vue
<!-- src/routes/index.vue -->

<template>
  <div>Hello {{ username.username }}!</div>
</template>

<script lang="ts">
import { loader$ } from "@biliblitz/blitz/server";
import { db } from "~/utils/database.ts";

// 这部分代码只会在服务端运行，在客户端会用魔法把他替换掉
export const useUsername = loader$(async (c) => {
  // 可以使用异步接口编写后端代码
  const user = await db.findUser({ id: 114514 });

  // 最后直接返回一个可以 JSON.stringify 的对象即可
  // 如果没有数据则应当返回 null 作为填充（总之就是不能返回 undefined）
  return { username: user.name };
});
</script>

<script setup lang="ts">
// 引用钩子函数获取 loader 在服务端运行的结果
const username = useUsername(); // ComputedRef<{ username: string }>
</script>
```
