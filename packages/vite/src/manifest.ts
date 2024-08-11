import { transform } from "@swc/core";
import type { Graph } from "@biliblitz/blitz/server";
import { generateRoutes } from "./routes.ts";
import { s } from "./utils.ts";
import type { ProjectStructure } from "./scanner.ts";
import removeServerCode from "@biliblitz/swc-plugin-remove-server-code";
import { hashRef } from "@biliblitz/blitz/utils";

export function toClientManifestCode(project: ProjectStructure, base: string) {
  return [
    // /** @see https://vitejs.dev/guide/backend-integration.html */
    // `import "vite/modulepreload-polyfill";`,
    `const base = ${s(base)};`,
    `const routes = ${generateRoutes(project, base, (i) => `() => import(${s(project.componentPaths[i])})`)};`,
    `export const manifest = { base, routes };`,
  ].join("\n");
}

export function toServerManifestCode(
  project: ProjectStructure,
  graph: Graph,
  base: string,
) {
  return [
    `import { unwrapServerLayer } from "@biliblitz/blitz/utils";`,
    ...project.componentPaths.flatMap((path, i) => [
      `import c${i} from "${path}";`,
      `import * as y${i} from "${path}";`,
      `const [l${i}, a${i}, m${i}, p${i}] = unwrapServerLayer(y${i}, "${hashRef(path)}");`,
    ]),

    `const base = ${s(base)};`,
    `const entry = ${s(graph.entry)};`,
    `const paths = [${project.componentPaths.map((_, i) => `p${i}`).join(", ")}];`,
    `const styles = [${graph.styles.map((x) => s(x)).join(", ")}];`,
    `const routes = ${generateRoutes(project, base, (i) => `c${i}`)};`,
    `const actions = [${project.componentPaths.map((_, i) => `a${i}`).join(", ")}];`,
    `const loaders = [${project.componentPaths.map((_, i) => `l${i}`).join(", ")}];`,
    `const directory = ${s(project.directory)};`,
    `const middlewares = [${project.componentPaths.map((_, i) => `m${i}`).join(", ")}];`,

    `export const manifest = { base, entry, paths, styles, routes, actions, loaders, directory, middlewares };`,
  ].join("\n");
}

export async function removeClientServerExports(source: string, salt: string) {
  // console.log("before >>>");
  // console.log(source);
  const { code, map } = await transform(source, {
    jsc: {
      parser: { syntax: "ecmascript", jsx: false },
      experimental: { plugins: [removeServerCode({ salt })] },
      target: "esnext",
      preserveAllComments: true,
    },
    sourceMaps: true,
  });
  // console.log("after <<<");
  // console.log(code);

  return { code, map };
}
