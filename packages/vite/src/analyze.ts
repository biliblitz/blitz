import { hashRef } from "./utils/crypto.ts";
import type { ProgramNode } from "rollup";

export type AnalyzeResult = {
  action: {
    name: string;
    ref: string;
    method: "POST" | "DELETE" | "PUT" | "PATCH";
  }[];
  loader: {
    name: string;
    ref: string;
  }[];
  middleware: boolean;
};

const methods = {
  action$: "POST",
  delete$: "DELETE",
  put$: "PUT",
  patch$: "PATCH",
} as const;

export function analyze(ast: ProgramNode, index: number): AnalyzeResult {
  const result: AnalyzeResult = {
    action: [],
    loader: [],
    middleware: false,
  };

  for (const item of ast.body) {
    if (
      item.type === "ExportNamedDeclaration" &&
      item.declaration &&
      item.declaration.type === "VariableDeclaration"
    ) {
      for (const decl of item.declaration.declarations) {
        if (decl.id.type === "Identifier") {
          const name = decl.id.name;

          if (name === "middleware") {
            result.middleware = true;
            continue;
          }

          if (
            decl.init &&
            decl.init.type === "CallExpression" &&
            decl.init.callee.type === "Identifier"
          ) {
            const func = decl.init.callee.name;
            const sref =
              decl.init.arguments.length > 0 &&
              decl.init.arguments[0].type === "Literal" &&
              typeof decl.init.arguments[0].value === "string" &&
              decl.init.arguments[0].value;

            switch (func) {
              case "action$":
              case "delete$":
              case "put$":
              case "patch$": {
                const ref = sref || hashRef(`action-${index}-${name}`);
                const method = methods[func];
                result.action.push({ name, ref, method });
                break;
              }

              case "loader$": {
                const ref = sref || hashRef(`loader-${index}-${name}`);
                result.loader.push({ name, ref });
                break;
              }
            }

            continue;
          }
        }
      }
    }
  }

  return result;
}
