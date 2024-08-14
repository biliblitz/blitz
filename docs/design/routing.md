# 路由系统

路由采用基于文件目录的层级路由形式。

## 路由路径

所有入口文件都从 `src/routes` 文件夹开始。

| 类型     | 优先级 | 形如        | 说明                             |
| -------- | ------ | ----------- | -------------------------------- |
| 一般路由 | 最高   | `alice`     | 匹配完全一致的一段路径           |
| 虚假路由 | 其次   | `(alice)`   | 不匹配任何路径（分类用）         |
| 参数路由 | 第三   | `[alice]`   | 匹配任意一段路径，并提供为参数   |
| 捕获路由 | 垫底   | `[[alice]]` | 匹配后面的所有路径，并提供为参数 |

例如对于文件夹 `/user/[name]/(info)/profile/`，将会匹配下面的路径：

- `/user/alice/profile/`，路由参数将会是 `{ name: "alice" }`
- `/user/bob/profile/`，路由参数将会是 `{ name: "bob" }`

对于文件夹 `/proxy/[[url]]/`，将会匹配下面的路径：

- `/proxy/foo/bar/`，路由参数将会是 `{ url: "foo/bar" }`
- `/proxy/https://mikanani.me/`，路由参数将会是 `{ url: "https://mikanani.me" }`

:::info
捕获路由可能现在还不太工作，我也不知道为什么 Hono 路由找不到。如果你有什么头猪，可以告诉我。
:::

## 渲染层级

每个文件目录都会检测两个文件，分别是 `index.xxx` 和 `layout.xxx`。

其中 `.xxx` 可以是下列任意一种后缀名之一：

- `.js` / `.ts` (`/\.[cm]?[jt]sx?/`) - 你所热爱的，就是你的 JavaScript
- `.md` / `.mdx` - 是的，你可以用 [MDX](/advanced/mdx) 的方式将 Markdown 直接转换成组件
- `.vue` - 你所热爱的，就是你的 Vue SFC

:::info
`index.xxx` 和 `layout.xxx` 都必须默认导出一个 Vue 组件，否则我写的狗屎代码将会崩溃！
:::

假设我们访问 `/user/alice/profile/` 路径，那么页面的组件嵌套结构可能是这样的：

- `src/routes/layout.vue`
- `src/routes/user/layout.vue`
- `src/routes/user/[name]/layout.vue`
- `src/routes/user/[name]/(info)/layout.vue`
- `src/routes/user/[name]/(info)/profile/layout.vue`
- `src/routes/user/[name]/(info)/profile/index.vue`

:::info
每一层的 `layout.xxx` 都应该包含一个 `<router-view />` 组件。

虽然没有也不会报错，但是 Vue Router 娘希望你记得。
:::
