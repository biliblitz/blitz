import { parseSync, type ESTree } from "vite";
import MagicString from "magic-string";
import { ScopeTracker, isReferenceIdentifier, walk } from "oxc-walker";
import { hashRef } from "@biliblitz/blitz/utils";

type Node = ESTree.Node;
type Unit = {
  node: Node;
  statement: ESTree.Statement | ESTree.ModuleDeclaration;
  dependencies: Set<Unit>;
  references: { node: Node; dependency: Unit }[];
  exported: string[];
  remove: boolean;
  replacement?: { call: ESTree.CallExpression; kind: string; ref: string };
};

const methods = new Map([
  ["loader$", "loader"],
  ["action$", "POST"],
  ["delete$", "DELETE"],
  ["put$", "PUT"],
  ["patch$", "PATCH"],
]);

/** Strip server implementations before either the dev server or bundler resolves imports. */
export function removeClientServerExports(
  source: string,
  salt: string,
  filename = "route.js",
) {
  // Vue/Markdown plugins have already compiled their non-JS syntax at this point.
  const lang = /\.[cm]?tsx$/.test(filename)
    ? "tsx"
    : /\.[cm]?ts$/.test(filename)
      ? "ts"
      : /\.jsx$/.test(filename)
        ? "jsx"
        : "js";
  const parsed = parseSync(filename, source, { lang, sourceType: "module" });
  if (parsed.errors.length) {
    throw new Error(
      `Cannot transform Blitz route ${filename}: ${parsed.errors[0].message}`,
    );
  }
  const program = parsed.program;
  const tracker = new ScopeTracker({ preserveExitedScopes: true });
  const names = new Set<string>();
  // Collect all declarations first, including hoisted and forward declarations.
  walk(program, {
    scopeTracker: tracker,
    enter(node) {
      if (node.type === "Identifier") names.add(node.name);
    },
  });
  tracker.freeze();

  const units: Unit[] = [];
  const exports = new Map<string, string[]>();
  const imports = new Map<string, string>();
  for (const statement of program.body) {
    if (statement.type === "ExportNamedDeclaration" && !statement.source) {
      for (const specifier of statement.specifiers) {
        const exported =
          specifier.exported.type === "Identifier"
            ? specifier.exported.name
            : String(specifier.exported.value);
        const local =
          specifier.local.type === "Identifier"
            ? specifier.local.name
            : String(specifier.local.value);
        const list = exports.get(local) ?? [];
        list.push(exported);
        exports.set(local, list);
      }
    }
    if (
      statement.type === "ImportDeclaration" &&
      statement.source.value === "@biliblitz/blitz/server"
    ) {
      for (const specifier of statement.specifiers) {
        if (specifier.type === "ImportSpecifier") {
          imports.set(
            specifier.local.name,
            specifier.imported.type === "Identifier"
              ? specifier.imported.name
              : String(specifier.imported.value),
          );
        }
      }
    }
  }
  for (const statement of program.body) {
    const declaration =
      statement.type === "ExportNamedDeclaration"
        ? statement.declaration
        : statement;
    const nodes =
      declaration?.type === "VariableDeclaration"
        ? declaration.declarations
        : statement.type === "ImportDeclaration"
          ? statement.specifiers
          : [declaration ?? statement];
    for (const node of nodes) {
      const id = "id" in node ? node.id : null;
      const exported =
        id?.type === "Identifier" ? [...(exports.get(id.name) ?? [])] : [];
      if (
        statement.type === "ExportNamedDeclaration" &&
        statement.declaration &&
        id?.type === "Identifier"
      ) {
        exported.push(id.name);
      }
      units.push({
        node,
        statement,
        dependencies: new Set(),
        references: [],
        exported,
        remove: false,
      });
    }
  }

  const unitFor = (node: Node) =>
    units.find(
      (unit) => unit.node.start <= node.start && node.end <= unit.node.end,
    );
  // Resolve references by binding identity, not identifier spelling. In particular,
  // parameters, block-scoped bindings, object keys and type names are not imports.
  walk(program, {
    scopeTracker: tracker,
    enter(node, parent) {
      if (node.type === "ExportNamedDeclaration" && node.source) this.skip();
      if (
        (node.type !== "Identifier" && node.type !== "JSXIdentifier") ||
        !isReferenceIdentifier(node, parent, { mode: "all" })
      )
        return;
      const mode = isReferenceIdentifier(node, parent, { mode: "type" })
        ? "type"
        : "value";
      const binding = tracker.getDeclaration(node.name, { mode });
      if (!binding || binding.scope !== "") return;
      const dependency = unitFor(binding.node);
      const owner = unitFor(node);
      if (owner && dependency && owner !== dependency) {
        owner.dependencies.add(dependency);
        owner.references.push({ node, dependency });
      }
    },
  });

  for (const unit of units) {
    if (
      unit.exported.some((name) => name === "middleware" || name === "paths")
    ) {
      unit.remove = true;
      continue;
    }
    const node = unit.node;
    if (
      !unit.exported.length ||
      node.type !== "VariableDeclarator" ||
      node.id.type !== "Identifier"
    )
      continue;
    const call = node.init;
    if (call?.type !== "CallExpression" || call.callee.type !== "Identifier")
      continue;
    const imported = imports.get(call.callee.name);
    // Preserve the historical unbound macro spelling, but don't mistake a local
    // function or an import from an unrelated library for a Blitz factory.
    const calleeName = call.callee.name;
    const binding = tracker.getDeclaration(calleeName);
    const kind = methods.get(imported ?? (!binding ? call.callee.name : ""));
    if (!kind) continue;
    if (unit.exported.length !== 1)
      throw new Error(
        `Blitz loader/action must have a single export name: ${unit.exported.join(", ")}`,
      );
    const first = call.arguments[0];
    const ref =
      first?.type === "Literal" &&
      typeof first.value === "string" &&
      first.value
        ? first.value
        : hashRef(`${salt}-${unit.exported[0]}`);
    unit.replacement = { call, kind, ref };
  }
  const serverUnits = units.filter((unit) => unit.remove || unit.replacement);
  if (!serverUnits.length) return null;

  const closure = (roots: Iterable<Unit>, client: boolean) => {
    const visited = new Set<Unit>();
    const visit = (unit: Unit) => {
      if (visited.has(unit) || (client && unit.remove)) return;
      visited.add(unit);
      const call = client ? unit.replacement?.call : undefined;
      const dependencies = call
        ? unit.references
            .filter(
              ({ node }) => node.start < call.start || node.end > call.end,
            )
            .map(({ dependency }) => dependency)
        : unit.dependencies;
      for (const dependency of dependencies) visit(dependency);
    };
    for (const root of roots) visit(root);
    return visited;
  };
  // Prune only dependencies of erased server code that the retained client code
  // cannot reach. Unrelated initializers and side-effect-only imports stay intact.
  const candidates = closure(serverUnits, false);
  const retained = closure(
    units.filter(
      (unit) =>
        !unit.remove &&
        (!candidates.has(unit) ||
          unit.exported.length > 0 ||
          (unit.statement.type === "ExportNamedDeclaration" &&
            !!unit.statement.declaration)),
    ),
    true,
  );
  for (const unit of candidates) if (!retained.has(unit)) unit.remove = true;

  const output = new MagicString(source);
  const helpers = new Map<string, string>();
  const helper = (kind: string) => {
    const imported = kind === "loader" ? "useLoader" : "useAction";
    let name = helpers.get(imported);
    if (!name) {
      name = `__blitz_${imported}`;
      while (names.has(name)) name += "_";
      names.add(name);
      helpers.set(imported, name);
    }
    return name;
  };
  for (const unit of units) {
    if (!unit.remove && unit.replacement) {
      const { call, kind, ref } = unit.replacement;
      output.overwrite(
        call.start,
        call.end,
        `() => ${helper(kind)}(${JSON.stringify(ref)}${kind === "loader" ? "" : `, ${JSON.stringify(kind)}`})`,
      );
    }
  }
  for (const statement of program.body) {
    const group = units.filter((unit) => unit.statement === statement);
    const kept = group.filter((unit) => !unit.remove);
    if (kept.length === group.length) continue;
    if (!kept.length) {
      // An explicitly side-effect-only import has no units and never reaches here.
      output.remove(statement.start, statement.end);
    } else if (statement.type === "ImportDeclaration") {
      const specifiers = kept.map(
        (unit) => unit.node as ESTree.ImportDeclarationSpecifier,
      );
      const named = specifiers.filter(
        (node) => node.type === "ImportSpecifier",
      );
      const others = specifiers.filter(
        (node) => node.type !== "ImportSpecifier",
      );
      const parts = others.map((node) => source.slice(node.start, node.end));
      if (named.length)
        parts.push(
          `{ ${named.map((node) => source.slice(node.start, node.end)).join(", ")} }`,
        );
      output.overwrite(
        statement.start,
        statement.end,
        `import ${statement.importKind === "type" ? "type " : ""}${parts.join(", ")} from ${source.slice(statement.source.start, statement.end)}`,
      );
    } else {
      // Remove consecutive declarators together, including the appropriate comma.
      for (let i = 0; i < group.length;) {
        if (!group[i].remove) {
          i++;
          continue;
        }
        const start = i;
        while (i < group.length && group[i].remove) i++;
        if (i < group.length)
          output.remove(group[start].node.start, group[i].node.start);
        else output.remove(group[start - 1].node.end, group[i - 1].node.end);
      }
    }
  }
  // Remove export specifiers for erased middleware/paths declarations as well.
  for (const statement of program.body) {
    if (
      statement.type !== "ExportNamedDeclaration" ||
      statement.source ||
      statement.declaration
    )
      continue;
    const kept = statement.specifiers.filter((specifier) => {
      const exported =
        specifier.exported.type === "Identifier"
          ? specifier.exported.name
          : specifier.exported.value;
      return exported !== "middleware" && exported !== "paths";
    });
    if (kept.length !== statement.specifiers.length) {
      output.overwrite(
        statement.start,
        statement.end,
        kept.length
          ? `export { ${kept.map((node) => source.slice(node.start, node.end)).join(", ")} };`
          : "",
      );
    }
  }
  if (helpers.size) {
    const imports = `import { ${[...helpers].map(([original, local]) => `${original} as ${local}`).join(", ")} } from "@biliblitz/blitz";\n`;
    const position = program.hashbang ? source.indexOf("\n") + 1 : 0;
    output.appendLeft(position, imports);
  }
  return {
    code: output.toString(),
    map: output.generateMap({
      source: filename,
      includeContent: true,
      hires: true,
    }),
  };
}
