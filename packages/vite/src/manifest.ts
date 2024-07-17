import { transform } from "@swc/core";
import type { Project, ProjectStructure } from "./scanner.ts";
import type { AnalyzeResult } from "./analyze.ts";
import type { Graph } from "@biliblitz/blitz/server";
import removeExportsWasm from "@swwind/remove-exports";

export function toClientManifestCode(structure: ProjectStructure) {
  return [
    // /** @see https://vitejs.dev/guide/backend-integration.html */
    // `import "vite/modulepreload-polyfill";`,
    `const components = new Array(${structure.componentPaths.length});`,
    `export const manifest = { components };`,
  ].join("\n");
}

export function toServerManifestCode(
  structure: ProjectStructure,
  project: Project,
  graph: Graph,
  base: string,
) {
  const { actions, loaders, middlewares, metas, components } = project;

  return [
    ...actions.map(
      (actions, i) =>
        `import { ${actions
          .map(({ name }, j) => `${name} as a${i}$${j}`)
          .join(", ")} } from "${structure.componentPaths[i]}";`,
    ),
    ...loaders.map(
      (loaders, i) =>
        `import { ${loaders
          .map(({ name }, j) => `${name} as l${i}$${j}`)
          .join(", ")} } from "${structure.componentPaths[i]}";`,
    ),
    ...metas.map(
      (has, i) =>
        has &&
        `import { meta as t${i} } from "${structure.componentPaths[i]}";`,
    ),
    ...components.map(
      (has, i) => has && `import c${i} from "${structure.componentPaths[i]}";`,
    ),
    ...middlewares.map(
      (has, i) =>
        has &&
        `import { middleware as m${i} } from "${structure.componentPaths[i]}";`,
    ),

    // assign ref
    ...actions.flatMap((actions, i) =>
      actions.map(({ ref }, j) => `a${i}$${j}._ref = "${ref}";`),
    ),
    ...loaders.flatMap((loaders, i) =>
      loaders.map(({ ref }, j) => `l${i}$${j}._ref = "${ref}";`),
    ),

    // export
    `const base = ${JSON.stringify(base)};`,
    `const graph = ${JSON.stringify(graph)};`,
    `const metas = [${structure.componentPaths
      .map((_, i) => (metas[i] ? `t${i}` : "null"))
      .join(", ")}];`,
    `const actions = [${actions
      .map((a, i) => `[${a.map((_, j) => `a${i}$${j}`).join(", ")}]`)
      .join(", ")}];`,
    `const loaders = [${loaders
      .map((l, i) => `[${l.map((_, j) => `l${i}$${j}`).join(", ")}]`)
      .join(", ")}];`,
    `const directory = ${JSON.stringify(structure.directory)};`,
    `const components = [${components
      .map((has, i) => (has ? `c${i}` : "null"))
      .join(", ")}];`,
    `const middlewares = [${middlewares
      .map((has, i) => (has ? `m${i}` : "null"))
      .join(", ")}];`,
    `export const manifest = { base, graph, metas, actions, loaders, directory, components, middlewares };`,
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
    ...(result.meta ? ["meta"] : []),
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
      `import { useAction as __injectAction, useLoader as __injectLoader } from "@biliblitz/blitz";`,
      ...result.action.map(
        (x) =>
          `export const ${x.name} = () => __injectAction("${x.ref}", "${x.method}");`,
      ),
      ...result.loader.map(
        (x) => `export const ${x.name} = () => __injectLoader("${x.ref}");`,
      ),
      result.component ? "" : "export default null;",
      code,
    ].join("\n"),
  };
}

export function toAssetsManifestCode(graph: Graph, base: string) {
  return `export default [${graph.assets
    .map((asset) => JSON.stringify(base + asset))
    .join(", ")}];`;
}
