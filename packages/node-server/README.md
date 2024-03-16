# `@biliblitz/node-server`

This package provides a static assets server.

**DEPRECATED: please use @hono/node-server directly**

```js
import { serveStatic } from "@biliblitz/node-server";

// type = (req: Request) => Promise<Response | null>
const assets = serveStatic({ root: "./public" });

const response = await assets(new Request("https://localhost/path/to/file"));
// this will return file located in "./public/path/to/file" if exists.
```

---

And some tools for using your server from `@biliblitz/blitz`.

```js
import { chain, when, startsWith } from "@biliblitz/node-server/tools";
import server from "./dist/server/entry.server.js";

const public = serveStatic({ root: "./public/" });
const assets = serveStatic({ root: "./dist/client/" });
const fetch = chain(public, when(startsWith("/build/"), assets), server);
```

Tools:

- `chain`: run handlers one by one
- `when`: run handler if condition is true

Conditions:

- `startsWith`: check if pathname of req.url starts with given value
- `endsWith`: same like above
- `matches`: check if req.pathname matches given regex
- `method`: check if req.method is given value
- `and`: check if every given conditions is true
- `or`: check if some given condition is true
- `not`: check if given condition is false

---

Finally serve the server using `@hono/node-server`.

```js
import { serve } from "@hono/node-server";

const server: (req: Request) => Promise<Response>
  = { /* ... */ };

serve({ fetch: server }, (info) => {
  console.log(`Listening on http://localhost:${info.port}/`);
});
```
