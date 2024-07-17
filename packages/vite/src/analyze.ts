import type { Module } from "@swc/core";
import { hashRef } from "./utils/crypto.ts";

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
  meta: boolean;
  middleware: boolean;
  component: boolean;
};

const methods = {
  action$: "POST",
  delete$: "DELETE",
  put$: "PUT",
  patch$: "PATCH",
} as const;

export function analyze(module: Module, index: number): AnalyzeResult {
  const result: AnalyzeResult = {
    action: [],
    loader: [],
    meta: false,
    middleware: false,
    component: false,
  };

  for (const item of module.body) {
    if (
      item.type === "ExportDefaultDeclaration" ||
      item.type === "ExportDefaultExpression"
    ) {
      result.component = true;
      continue;
    }

    if (
      item.type === "ExportDeclaration" &&
      item.declaration.type === "VariableDeclaration" &&
      !item.declaration.declare
    ) {
      for (const decl of item.declaration.declarations) {
        if (decl.id.type === "Identifier") {
          const name = decl.id.value;

          if (name === "meta") {
            result.meta = true;
            continue;
          }

          if (name === "middleware") {
            result.middleware = true;
            continue;
          }

          if (
            decl.init &&
            decl.init.type === "CallExpression" &&
            decl.init.callee.type === "Identifier"
          ) {
            const func = decl.init.callee.value;
            const sref =
              decl.init.arguments.length > 0 &&
              decl.init.arguments[0].expression.type === "StringLiteral" &&
              decl.init.arguments[0].expression.value;

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
