import assert from "node:assert/strict";
import { test } from "node:test";
import { action$, createServer, loader$ } from "@biliblitz/blitz/server";

const directory = (index = null, layout = null, children = []) => ({
  route: { index, layout },
  children,
});

test("catch-all routes serve pages, loaders and actions alongside parameter routes", async () => {
  const post = loader$((c) => c.req.param("id"));
  post._ref = "post";
  const user = loader$((c) => c.req.param("id"));
  user._ref = "user";
  const submit = action$("submit", (c) => c.req.param("id"));
  const manifest = {
    base: "/",
    entry: "",
    styles: [],
    routes: [],
    paths: [null, null, null],
    loaders: [[], [post], [user]],
    actions: [[], [submit], []],
    middlewares: [null, null, null],
    directory: directory(null, 0, [
      ["post", directory(null, null, [["[[id]]", directory(1, 0)]])],
      ["user", directory(null, null, [["[id]", directory(2, 0)]])],
    ]),
  };
  const app = createServer((c, runtime) => c.json(runtime), { manifest });

  for (const id of ["alice/public", "bob/private", "single", "a/b/c"]) {
    const page = await app.request(`/post/${id}/`);
    assert.equal(page.status, 200);
    assert.deepEqual(await page.json(), { loaders: [["post", id]] });

    const data = await app.request(`/post/${id}/_data.json`);
    assert.equal(data.status, 200);
    assert.deepEqual(await data.json(), {
      ok: "loader",
      loaders: [["post", id]],
    });

    const action = await app.request(`/post/${id}/_data.json?_action=submit`, {
      method: "POST",
    });
    assert.deepEqual(await action.json(), { ok: "action", action: id });
  }

  const data = await app.request("/user/alice/_data.json");
  assert.deepEqual(await data.json(), {
    ok: "loader",
    loaders: [["user", "alice"]],
  });
  assert.equal((await app.request("/user/alice/public/")).status, 404);
  assert.equal((await app.request("/post/")).status, 404);
});
