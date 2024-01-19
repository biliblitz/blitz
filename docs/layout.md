# 布局

blitz 的布局是完全按照路径层级嵌套的。

例如，如果你要渲染的是 `/foo/(bar)/index.tsx` 页面，那么嵌套关系如下：

- `/layout.tsx`
- `/foo/layout.tsx`
- `/foo/(bar)/layout.tsx`
- `/foo/(bar)/index.tsx`

这些组件都会被导入，并且通过 `props.children` 方式进行注入。

例如如果上述的所有组件都存在，那么在实际渲染的时候等价于以下代码：

```jsx
import Comp1 from "@/layout.tsx";
import Comp2 from "@/foo/layout.tsx";
import Comp3 from "@/foo/(bar)/layout.tsx";
import Comp4 from "@/foo/(bar)/index.tsx";

export function RouterOutlet() {
  return (
    <Comp1>
      <Comp2>
        <Comp3>
          <Comp4 />
        </Comp3>
      </Comp2>
    </Comp1>
  );
}
```

在实现 `layout.tsx` 的时候注意一定不要忘记使用 `props.children`，可以使用 `layout$` 函数进行类型的简化声明。

```jsx
// layout.tsx
import { layout$ } from "@biliblitz/blitz";

export default layout$((props) => {
  return (
    <div>
      <h1>Layout</h1>
      {props.children}
    </div>
  );
});
```

在实现 `index.tsx` 的时候就可以很简单，直接返回一个合法的 preact 函数组件即可。

或者如果你觉得不好看，可以套一个 `index$` 函数。

```jsx
// index.tsx
export default () => {
  return <span>Index</span>;
};
```
