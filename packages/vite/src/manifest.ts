import { transform } from "@swc/core";
import type { Project } from "./scanner.ts";
import type { AnalyzeResult } from "./analyze.ts";
import type { Graph } from "@biliblitz/blitz/server";
import removeExportsWasm from "@swwind/remove-exports";
import { generateRoutes } from "./routes.ts";
import { s } from "./utils/algorithms.ts";

export function toClientManifestCode(project: Project, base: string) {
  return [
    // /** @see https://vitejs.dev/guide/backend-integration.html */
    // `import "vite/modulepreload-polyfill";`,
    `const base = ${s(base)};`,
    `const routes = ${generateRoutes(project, base, (i) => `() => import(${s(project.structure.componentPaths[i])})`)};`,
    `export const manifest = { base, routes };`,
  ].join("\n");
}

export function toServerManifestCode(
  project: Project,
  graph: Graph,
  base: string,
) {
  const { actions, loaders, middlewares } = project;

  return [
    ...actions.map(
      (actions, i) =>
        `import { ${actions
          .map(({ name }, j) => `${name} as a${i}$${j}`)
          .join(", ")} } from "${project.structure.componentPaths[i]}";`,
    ),
    ...loaders.map(
      (loaders, i) =>
        `import { ${loaders
          .map(({ name }, j) => `${name} as l${i}$${j}`)
          .join(", ")} } from "${project.structure.componentPaths[i]}";`,
    ),
    ...middlewares.map(
      (has, i) =>
        has &&
        `import { middleware as m${i} } from "${project.structure.componentPaths[i]}";`,
    ),
    ...project.structure.componentPaths.map(
      (path, i) => `import c${i} from "${path}";`,
    ),

    // assign ref
    ...actions.flatMap((actions, i) =>
      actions.map(({ ref }, j) => `a${i}$${j}._ref = "${ref}";`),
    ),
    ...loaders.flatMap((loaders, i) =>
      loaders.map(({ ref }, j) => `l${i}$${j}._ref = "${ref}";`),
    ),

    // export
    `const base = ${s(base)};`,
    `const entry = ${s(graph.entry)};`,
    `const styles = [${graph.styles.map((x) => s(x)).join(", ")}];`,
    `const routes = ${generateRoutes(project, base, (i) => `c${i}`)};`,
    `const actions = [${actions
      .map((a, i) => `[${a.map((_, j) => `a${i}$${j}`).join(", ")}]`)
      .join(", ")}];`,
    `const loaders = [${loaders
      .map((l, i) => `[${l.map((_, j) => `l${i}$${j}`).join(", ")}]`)
      .join(", ")}];`,
    `const directory = ${s(project.structure.directory)};`,
    `const middlewares = [${middlewares
      .map((has, i) => (has ? `m${i}` : "null"))
      .join(", ")}];`,

    `export const manifest = { base, entry, styles, routes, actions, loaders, directory, middlewares };`,
  ]
    .map((x) => x || "")
    .join("\n");
}

export async function removeClientServerExports(
  source: string,
  result: AnalyzeResult,
) {
  const removes = [
    ...result.action.map((x) => x.name),
    ...result.loader.map((x) => x.name),
    ...(result.middleware ? ["middleware"] : []),
  ];

  // console.log("wasm", wasm);
  const { code } = await transform(source, {
    jsc: {
      parser: {
        syntax: "ecmascript",
        jsx: false,
      },
      experimental: {
        plugins: [removeExportsWasm({ removes })],
      },
      preserveAllComments: true,
    },
    // sourceMaps: true,
  });

  return {
    code: [
      `import { useAction as _useAction, useLoader as _useLoader } from "@biliblitz/blitz";`,
      ...result.action.map(
        (x) =>
          `export const ${x.name} = () => _useAction("${x.ref}", "${x.method}");`,
      ),
      ...result.loader.map(
        (x) => `export const ${x.name} = () => _useLoader("${x.ref}");`,
      ),
      code,
    ].join("\n"),
  };
}
