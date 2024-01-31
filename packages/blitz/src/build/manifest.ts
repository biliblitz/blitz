import { FunctionComponent } from "preact";
import { ActionMeta, Directory, LoaderMeta, Project } from "./scanner.ts";
import { Action } from "../server/action.ts";
import { Loader } from "../server/loader.ts";
import { Middleware } from "../server/middleware.ts";
import { Graph } from "./graph.ts";

export interface ClientManifest {
  components: FunctionComponent[];
}

export interface ServerManifest extends ClientManifest {
  actions: Action[][];
  loaders: Loader[][];
  middlewares: Middleware[];
  directory: Directory;
  graph: Graph;
}

export function toClientManifestCode({ structure }: Project) {
  return [
    /** @see https://vitejs.dev/guide/backend-integration.html */
    `import "vite/modulepreload-polyfill";`,
    `const components = new Array(${structure.componentPaths.length});`,
    `export const manifest = { components };`,
  ].join("\n");
}

export function toServerManifestCode(project: Project, graph: Graph) {
  const { structure, actions, loaders, middlewares } = project;

  return [
    ...structure.componentPaths.map(
      (filePath, i) => `import c${i} from "${filePath}";`,
    ),
    ...actions.map(
      (actions, i) =>
        `import { ${actions
          .map(({ name }, j) => `${name} as a${i}_${j}`)
          .join(", ")} } from "${structure.actionPaths[i]}";`,
    ),
    ...loaders.map(
      (loaders, i) =>
        `import { ${loaders
          .map(({ name }, j) => `${name} as l${i}_${j}`)
          .join(", ")} } from "${structure.loaderPaths[i]}";`,
    ),
    ...structure.middlewarePaths.map(
      (filePath, i) => `import m${i} from "${filePath}";`,
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
    `const components = [${structure.componentPaths.map((_, i) => `c${i}`).join(", ")}];`,
    `const actions = [${actions.map((a, i) => `[${a.map((_, j) => `a${i}_${j}`).join(", ")}]`).join(", ")}];`,
    `const loaders = [${loaders.map((l, i) => `[${l.map((_, j) => `l${i}_${j}`).join(", ")}]`).join(", ")}];`,
    `const middlewares = [${middlewares.map((_, i) => `m${i}`).join(", ")}];`,
    `const directory = ${JSON.stringify(structure.directory)};`,
    `const graph = ${JSON.stringify(graph)};`,
    `export const manifest = { components, actions, loaders, middlewares, directory, graph };`,
  ].join("\n");
}

export function toClientActionCode(actions: ActionMeta) {
  return [
    `import { useAction } from "@biliblitz/blitz";`,
    ...actions.map(
      ({ name, ref }) => `export const ${name} = () => useAction("${ref}");`,
    ),
  ].join("\n");
}

export function toClientLoaderCode(loaders: LoaderMeta) {
  return [
    `import { useLoader } from "@biliblitz/blitz";`,
    ...loaders.map(
      ({ name, ref }) => `export const ${name} = () => useLoader("${ref}");`,
    ),
  ].join("\n");
}
