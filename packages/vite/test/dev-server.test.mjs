import assert from "node:assert/strict";
import { test } from "node:test";
import {
  cp,
  mkdtemp,
  readdir,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { build, createServer } from "vite";
import { hashRef } from "@biliblitz/blitz/utils";

test(
  "dev and production strip server imports while SSR executes the original loaders",
  { timeout: 30000 },
  async () => {
    const example = fileURLToPath(
      new URL("../../../examples/minimal/", import.meta.url),
    );
    const root = await mkdtemp(join(tmpdir(), "blitz-oxc-"));
    const cwd = process.cwd();
    let server;
    try {
      await cp(join(example, "src"), join(root, "src"), { recursive: true });
      for (const name of ["vite.config.ts", "tsconfig.json", "package.json"]) {
        await cp(join(example, name), join(root, name));
      }
      await symlink(
        join(example, "node_modules"),
        join(root, "node_modules"),
        "dir",
      );
      await writeFile(
        join(root, "src/secret.server.ts"),
        `import { readFileSync } from "node:fs";
      export const query = () => "server-only-marker:" + typeof readFileSync;`,
      );
      const route = join(root, "src/routes/index.vue");
      await writeFile(
        route,
        `<script lang="ts">
      import { loader$ } from "@biliblitz/blitz/server";
      import { query } from "../secret.server.ts";
      export const useData = loader$(() => query());
      </script>
      <script setup lang="ts">const value = useData();</script>
      <template><div>{{ value }}</div></template>`,
      );
      process.chdir(root);
      server = await createServer({
        root,
        server: { host: "127.0.0.1", port: 0 },
        logLevel: "error",
      });
      await server.listen();
      const result = await server.transformRequest("/src/routes/index.vue");
      assert.ok(result);
      assert.doesNotMatch(
        result.code,
        /secret\.server|blitz\/server|server-only-marker/,
      );
      const reference = hashRef(`${hashRef(route)}-useData`);
      assert.ok(result.code.includes(reference), result.code);
      assert.match(result.code, /useLoader/);
      const ssr = await server.ssrLoadModule("/src/routes/index.vue");
      assert.equal(typeof ssr.useData._fn, "function");
      const { unwrapServerLayer } = await server.ssrLoadModule(
        "@biliblitz/blitz/utils",
      );
      unwrapServerLayer(ssr, hashRef(route));
      assert.equal(ssr.useData._ref, reference);
      assert.equal(await ssr.useData._fn(), "server-only-marker:function");
      const address = server.httpServer.address();
      const response = await fetch(`http://127.0.0.1:${address.port}/`);
      assert.equal(response.status, 200);
      assert.match(await response.text(), /server-only-marker:function/);
      await build({ root, logLevel: "error" });
      const buildDir = join(root, "dist/client/build");
      const files = await readdir(buildDir, { recursive: true });
      const scripts = await Promise.all(
        files
          .filter((name) => name.endsWith(".js"))
          .map((name) => readFile(join(buildDir, name), "utf8")),
      );
      const bundle = scripts.join("\n");
      assert.doesNotMatch(bundle, /server-only-marker|secret\.server|node:fs/);
      assert.ok(
        bundle.includes(reference),
        "production RPC reference must match SSR",
      );
    } finally {
      await server?.close();
      process.chdir(cwd);
      await rm(root, { recursive: true, force: true });
    }
  },
);
