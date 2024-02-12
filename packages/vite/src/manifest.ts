import { ActionMeta, LoaderMeta, Project } from "./scanner.ts";
import { removeExports } from "./remove-exports.ts";
import { Graph } from "@biliblitz/blitz/server";

export function toClientManifestCode({ structure }: Project) {
  return [
    /** @see https://vitejs.dev/guide/backend-integration.html */
    `import "vite/modulepreload-polyfill";`,
    `const components = new Array(${structure.componentPaths.length});`,
    `export const manifest = { components };`,
  ].join("\n");
}

export function toServerManifestCode(
  project: Project,
  graph: Graph,
  base: string,
) {
  const { structure, actions, loaders, middlewares, metas } = project;

  return [
    ...structure.componentPaths.map(
      (filePath, i) => `import c${i} from "${filePath}";`,
    ),
    ...actions.map(
      (actions, i) =>
        `import { ${actions
          .map(({ name }, j) => `${name} as a${i}_${j}`)
          .join(", ")} } from "${structure.componentPaths[i]}";`,
    ),
    ...loaders.map(
      (loaders, i) =>
        `import { ${loaders
          .map(({ name }, j) => `${name} as l${i}_${j}`)
          .join(", ")} } from "${structure.componentPaths[i]}";`,
    ),
    ...metas
      .map((hasMeta, i) =>
        hasMeta
          ? `import { meta as t${i} } from "${structure.componentPaths[i]}";`
          : null,
      )
      .filter((s) => s !== null),
    ...structure.middlewarePaths.map(
      (filePath, i) => `import m${i} from "${filePath}";`,
    ),
    ...structure.staticPaths.map(
      (filePath, i) => `import s${i} from "${filePath}";`,
    ),

    // assign ref
    ...actions.flatMap((actions, i) =>
      actions.map(({ ref }, j) => `a${i}_${j}._ref = "${ref}";`),
    ),
    ...loaders.flatMap((loaders, i) =>
      loaders.map(({ ref }, j) => `l${i}_${j}._ref = "${ref}";`),
    ),
    ...middlewares.map(({ ref }, i) => `m${i}._ref = "${ref}";`),

    // export
    `const base = ${JSON.stringify(base)};`,
    `const graph = ${JSON.stringify(graph)};`,
    `const metas = [${structure.componentPaths.map((_, i) => (metas[i] ? `t${i}` : "null")).join(", ")}];`,
    `const actions = [${actions.map((a, i) => `[${a.map((_, j) => `a${i}_${j}`).join(", ")}]`).join(", ")}];`,
    `const loaders = [${loaders.map((l, i) => `[${l.map((_, j) => `l${i}_${j}`).join(", ")}]`).join(", ")}];`,
    `const statics = [${structure.staticPaths.map((_, i) => `s${i}`).join(", ")}];`,
    `const directory = ${JSON.stringify(structure.directory)};`,
    `const components = [${structure.componentPaths.map((_, i) => `c${i}`).join(", ")}];`,
    `const middlewares = [${middlewares.map((_, i) => `m${i}`).join(", ")}];`,
    `export const manifest = { base, graph, metas, actions, loaders, statics, directory, components, middlewares };`,
  ].join("\n");
}

export function removeClientServerExports(
  source: string,
  actions: ActionMeta,
  loaders: LoaderMeta,
  hasMeta: boolean,
) {
  const remove = removeExports(source, [
    ...actions.map(({ name }) => name),
    ...loaders.map(({ name }) => name),
    ...(hasMeta ? ["meta"] : []),
  ]);

  const imports: string[] = [];

  if (actions.length > 0) {
    imports.push(
      `import { useAction as $blitz$useAction } from "@biliblitz/blitz";`,
    );
  }
  if (loaders.length > 0) {
    imports.push(
      `import { useLoader as $blitz$useLoader } from "@biliblitz/blitz";`,
    );
  }
  imports.push(
    ...actions.map(
      (action) =>
        `export const ${action.name} = () => $blitz$useAction("${action.ref}");`,
    ),
  );
  imports.push(
    ...loaders.map(
      (loader) =>
        `export const ${loader.name} = () => $blitz$useLoader("${loader.ref}");`,
    ),
  );

  return imports.join("\n") + remove;
}
