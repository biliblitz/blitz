import assert from "node:assert/strict";
import { test } from "node:test";
import { parseSync, transformWithOxc } from "vite";
import { hashRef, unwrapServerLayer } from "@biliblitz/blitz/utils";
import {
  loader$,
  action$,
  put$,
  patch$,
  delete$,
} from "@biliblitz/blitz/server";
import { removeClientServerExports } from "../dist/remove-server-code.js";

const salt = "ZW6S8L8";
function transform(source, filename = "route.js") {
  const result = removeClientServerExports(source, salt, filename);
  assert.ok(result, "expected a server-code transformation");
  const parsed = parseSync(filename, result.code, {
    lang: filename.endsWith("tsx")
      ? "tsx"
      : filename.endsWith("ts")
        ? "ts"
        : "js",
  });
  assert.deepEqual(parsed.errors, [], result.code);
  return result;
}
async function evaluate(source, filename = "route.js") {
  let { code } = transform(source, filename);
  if (filename.endsWith("ts"))
    ({ code } = await transformWithOxc(code, filename));
  const runtime = `data:text/javascript,${encodeURIComponent(
    "export const useLoader = (...args) => args; export const useAction = (...args) => args;",
  )}`;
  code = code.replaceAll('"@biliblitz/blitz"', JSON.stringify(runtime));
  return import(`data:text/javascript,${encodeURIComponent(code)}`);
}

test("replaces every RPC kind with the same reference and method as the server", async () => {
  const factories = { loader$, action$, put$, patch$, delete$ };
  for (const [name, factory] of Object.entries(factories)) {
    for (const explicit of [null, "explicit", "", "用户数据"]) {
      const source = `import { ${name} } from "@biliblitz/blitz/server";
        export const useRandom = ${name}(${explicit === null ? "" : `${JSON.stringify(explicit)}, `}() => Math.random());`;
      const client = await evaluate(source);
      const value =
        explicit === null ? factory(() => null) : factory(explicit, () => null);
      unwrapServerLayer({ useRandom: value }, salt);
      assert.deepEqual(
        client.useRandom(),
        name === "loader$" ? [value._ref] : [value._ref, value._mthd],
      );
    }
  }
  assert.equal(hashRef(`${salt}-useRandom`), "hO+ivOO");
});

test("removes transitive server dependencies, functions, classes and cycles", () => {
  const { code } = transform(`
    import db from "./db.server.js";
    import { loader$ } from "@biliblitz/blitz/server";
    const query = () => client.run();
    const client = new Database();
    class Database { run() { return db.query() + first(); } }
    function first() { return second(); }
    function second() { return first(); }
    export const useData = loader$(() => query());
  `);
  assert.doesNotMatch(code, /db\.server|Database|query|first|second|client/);
});

test("preserves shared dependencies and unrelated side effects", () => {
  const { code } = transform(`
    import db from "./db.server.js";
    import { shared, serverOnly } from "./shared.js";
    import "./side-effects.js";
    const unrelated = initialize();
    const server = () => db.query(serverOnly);
    export const useData = loader$(() => server() + shared);
    export const client = () => shared;
    console.log("keep me");
  `);
  assert.doesNotMatch(code, /db\.server|serverOnly|const server/);
  assert.match(code, /import \{ shared \} from/);
  assert.match(code, /side-effects\.js/);
  assert.match(code, /unrelated = initialize/);
  assert.match(code, /console.log\("keep me"\)/);
});

test("removes middleware and paths, including their dependencies", () => {
  const { code } = transform(`
    import { middleware$ } from "@biliblitz/blitz/server";
    import secret from "./secret.server.js";
    export const middleware = middleware$(() => secret);
    export const paths = () => [secret];
    export const other = 123;
  `);
  assert.doesNotMatch(code, /middleware|paths|secret/);
  assert.match(code, /export const other = 123/);
});

test("supports separately exported RPCs and server declarations", async () => {
  const source = `const local = loader$(() => 123);
    const mw = () => "secret";
    const routes = () => ["alice"];
    export { local as useData, mw as middleware, routes as paths };`;
  const { code } = transform(source);
  assert.doesNotMatch(code, /secret|alice|\bmw\b|\broutes\b/);
  const client = await evaluate(source);
  assert.deepEqual(client.useData(), [hashRef(`${salt}-useData`)]);
});

test("handles aliases imported from Blitz and leaves unrelated factories alone", () => {
  const { code } = transform(`
    import { loader$ as load } from "@biliblitz/blitz/server";
    import { action$ } from "another-framework";
    export const useData = load(() => "secret");
    export const unrelated = action$(() => "keep");
  `);
  assert.doesNotMatch(code, /secret|blitz\/server/);
  assert.match(code, /another-framework/);
  assert.match(code, /action\$\(\(\) => "keep"\)/);
  assert.equal(
    removeClientServerExports(
      `function loader$(fn) { return fn; }
    export const unrelated = loader$(() => 42);`,
      salt,
    ),
    null,
  );
  assert.equal(
    removeClientServerExports(
      `import loader$ from "another-framework";
    export const unrelated = loader$(() => 42);`,
      salt,
    ),
    null,
  );
});

test("distinguishes shadowed parameters, forward bindings, block and catch scopes", () => {
  const { code } = transform(`
    import db from "./secret.server.js";
    export const useData = loader$(() => db.query());
    export function client() {
      const fn = () => db;
      const db = "local";
      return fn();
    }
    export const parameter = (db) => db;
    export const caught = () => { try { throw 0 } catch (db) { return db } };
    export const block = () => { { const db = 1; console.log(db) } };
  `);
  assert.doesNotMatch(code, /secret\.server/);
  assert.match(code, /const db = "local"/);
});

test("retains imports used through shorthand and computed properties", () => {
  for (const expression of [
    "({ db })",
    "({ [db]: 1 })",
    "class { [db]() {} }",
    "() => db",
  ]) {
    const { code } = transform(`import db from "./shared.js";
      export const useData = loader$(() => db);
      export const client = ${expression};`);
    assert.match(code, /shared\.js/);
  }
  const { code } = transform(`import db from "./secret.server.js";
    export const useData = loader$(() => db);
    export const client = { db: 1 };`);
  assert.doesNotMatch(code, /secret\.server/);
});

test("removes individual declarators with valid comma placement", () => {
  for (const declarations of [
    'secret = "secret", keep = "public"',
    'keep = "public", secret = "secret"',
    'first = "public", secret = "secret", keep = "public"',
    'secret = "secret", alsoSecret = secret, keep = "public"',
  ]) {
    const { code } = transform(`const ${declarations};
      export const useData = loader$(() => secret);
      export default typeof first === "undefined" ? keep : first;`);
    // alsoSecret is unrelated to the RPC and must retain its initializer/secret.
    if (!declarations.includes("alsoSecret"))
      assert.doesNotMatch(code, /"secret"/);
    assert.match(code, /"public"/);
  }
  const { code } =
    transform(`export const middleware = () => "secret", keep = "public", paths = () => [];
    export default keep;`);
  assert.doesNotMatch(code, /middleware|paths|secret/);
  assert.match(code, /export const keep/);
});

test("handles destructuring as a group and retains bindings needed by the client", () => {
  const removed = transform(`import db from "./secret.server.js";
    const { a: { b = 1 }, ...rest } = db();
    export const useData = loader$(() => [b, rest]);`).code;
  assert.doesNotMatch(removed, /secret\.server|\brest\b/);
  const kept = transform(`import db from "./shared.js";
    const { a, b } = db();
    export const useData = loader$(() => a);
    export default b;`).code;
  assert.match(kept, /shared\.js/);
  assert.match(kept, /const \{ a, b \}/);
});

test("preserves default, named and namespace import combinations and attributes", () => {
  for (const [declaration, server, client] of [
    [
      'import main, { secret, shared } from "./shared.js";',
      "[main, secret]",
      "shared",
    ],
    ['import main, { secret } from "./shared.js";', "secret", "main"],
    ['import main, * as ns from "./shared.js";', "main", "ns"],
    ['import main, * as ns from "./shared.js";', "ns", "main"],
    ['import data from "./data.json" with { type: "json" };', "data", "data"],
  ]) {
    const { code } = transform(`${declaration}
      export const useData = loader$(() => ${server}); export default ${client};`);
    assert.match(code, /import/);
    if (declaration.includes('type: "json"'))
      assert.match(code, /with \{ type: "json" \}/);
  }
});

test("does not confuse a re-export with a reference to a local binding", () => {
  const { code } = transform(`import value from "./secret.server.js";
    export const useData = loader$(() => value);
    export { value } from "./public.js";`);
  assert.doesNotMatch(code, /secret\.server/);
  assert.match(code, /public\.js/);
});

test("avoids generated helper collisions, including nested bindings", async () => {
  const client = await evaluate(`const __blitz_useLoader = "keep";
    const fn = (__blitz_useLoader_) => __blitz_useLoader_;
    export const useData = loader$(() => "secret");
    export default [__blitz_useLoader, fn(123)];`);
  assert.deepEqual(client.default, ["keep", 123]);
  assert.deepEqual(client.useData(), [hashRef(`${salt}-useData`)]);
});

test("preserves TypeScript declarations needed outside a replaced initializer", async () => {
  const source = `import { loader$ } from "@biliblitz/blitz/server";
    type Result = () => string[];
    const server = (): string => "secret";
    export const useData: Result = loader$(() => server());`;
  const { code } = transform(source, "route.ts");
  assert.match(code, /type Result/);
  assert.doesNotMatch(code, /secret|const server|blitz\/server/);
  assert.deepEqual((await evaluate(source, "route.ts")).useData(), [
    hashRef(`${salt}-useData`),
  ]);
});

test("retains a component referenced in JSX", () => {
  const { code } = transform(
    `import Component from "./shared.js";
    export const useData = loader$(() => Component);
    export default () => <Component />;`,
    "route.tsx",
  );
  assert.match(code, /shared\.js/);
});

test("preserves comments and emits a map to the actual route filename", () => {
  const source =
    '// 客户端注释\nexport const useData = loader$(() => "secret");\nexport default 123;';
  const { code, map } = transform(source, "/app/routes/index.vue");
  assert.match(code, /客户端注释/);
  assert.deepEqual(map.sources, ["/app/routes/index.vue"]);
  assert.deepEqual(map.sourcesContent, [source]);
  assert.ok(map.mappings.length);
});

test("unchanged routes return null and malformed input fails visibly", () => {
  assert.equal(
    removeClientServerExports('import "./effect.js"; export default 1;', salt),
    null,
  );
  assert.throws(
    () => removeClientServerExports("export const =", salt, "broken.ts"),
    /broken.ts/,
  );
});

test("rejects ambiguous multiple export names for one RPC", () => {
  assert.throws(
    () =>
      transform(
        `const local = loader$(() => 1); export { local as a, local as b };`,
      ),
    /single export name/,
  );
});

test("keeps the type namespace distinct from a same-named server value", () => {
  const { code } = transform(
    `import Result from "./secret.server.js";
    type Result = string;
    export const useData = loader$(() => Result());
    export const client = (value: Result) => value;`,
    "route.ts",
  );
  assert.doesNotMatch(code, /secret\.server/);
  assert.match(code, /type Result = string/);
});
