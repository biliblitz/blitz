import type { Directory } from "@biliblitz/blitz/server";
import type { Project } from "./scanner.ts";
import { s } from "./utils/algorithms.ts";

export function generateRoutes(
  project: Project,
  base: string,
  imports: (index: number) => string,
): string {
  const dfs = (directory: Directory, name: string): string => {
    const children = directory.children.map(([name, dir]) => dfs(dir, name));
    if (directory.route.index != null) {
      children.unshift(
        `{ path: "", component: ${imports(directory.route.index)} }`,
      );
    }

    const members = [`path: ${s(convertNameToRouterPath(name))}`];
    if (directory.route.layout != null) {
      members.push(`component: ${imports(directory.route.layout)}`);
    }
    if (children.length > 0) {
      members.push(`children: [${children.join(", ")}]`);
    }

    return `{ ${members.join(", ")} }`;
  };
  return `[${dfs(project.structure.directory, base)}]`;
}

function convertNameToRouterPath(name: string) {
  if (name.startsWith("[[") && name.endsWith("]]"))
    return `:${name.slice(2, -2)}+`;
  if (name.startsWith("[") && name.endsWith("]"))
    return `:${name.slice(1, -2)}`;
  if (name.startsWith("(") && name.endsWith(")")) return "";
  return `${name}`;
}
