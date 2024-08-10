# @biliblitz/swc-plugin-remove-server-code

Detect following patterns:

```js
export const x = loader$(/* ... */);
export const y = action$(/* ... */);
export const middleware = /* ... */;
```

Remove those code and relative imports.
