import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(projectRoot, "src");

function sourceFiles(directory: string): string[] {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(absolutePath);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [absolutePath] : [];
  });
}

function importedSpecifiers(filePath: string): string[] {
  const sourceFile = ts.createSourceFile(
    filePath,
    fs.readFileSync(filePath, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const specifiers: string[] = [];

  function visit(node: ts.Node): void {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      specifiers.push(node.moduleSpecifier.text);
    }
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments[0] &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      specifiers.push(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return specifiers;
}

function importsNamedFrom(filePath: string, packageName: string, importName: string): boolean {
  const sourceFile = ts.createSourceFile(
    filePath,
    fs.readFileSync(filePath, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  return sourceFile.statements.some((statement) =>
    ts.isImportDeclaration(statement) &&
    ts.isStringLiteral(statement.moduleSpecifier) &&
    statement.moduleSpecifier.text === packageName &&
    statement.importClause?.namedBindings &&
    ts.isNamedImports(statement.importClause.namedBindings) &&
    statement.importClause.namedBindings.elements.some(
      (element) => (element.propertyName?.text ?? element.name.text) === importName,
    ),
  );
}

function resolveProjectImport(fromFile: string, specifier: string): string | null {
  if (specifier.startsWith("@/")) return path.join(sourceRoot, specifier.slice(2));
  if (specifier.startsWith(".")) return path.resolve(path.dirname(fromFile), specifier);
  return null;
}

function area(filePath: string): { kind: string; name?: string } {
  const segments = path.relative(sourceRoot, filePath).split(path.sep);
  return { kind: segments[0] ?? "", name: segments[0] === "modules" ? segments[1] : undefined };
}

const applicationLayers = new Set([
  "app",
  "domain",
  "modules",
  "platform",
  "root",
  "server",
  "shared-state",
]);

const allowedDependencies: Readonly<Record<string, ReadonlySet<string>>> = {
  app: new Set(["modules", "platform", "root", "shared-state"]),
  domain: new Set(),
  modules: new Set(["domain", "platform", "shared-state"]),
  platform: new Set(["domain"]),
  root: new Set(["modules", "platform", "shared-state"]),
  server: new Set(["domain"]),
  "shared-state": new Set(["domain"]),
};

function canImport(
  sourceArea: { kind: string; name?: string },
  targetArea: { kind: string; name?: string },
  filePath: string,
): boolean {
  if (sourceArea.kind === targetArea.kind) {
    return sourceArea.kind !== "modules" || sourceArea.name === targetArea.name;
  }
  if (sourceArea.kind === "app" && targetArea.kind === "server") {
    return path.relative(sourceRoot, filePath).split(path.sep)[1] === "api";
  }
  return allowedDependencies[sourceArea.kind]?.has(targetArea.kind) ?? false;
}

describe("architecture boundaries", () => {
  it("enforces the application dependency graph", () => {
    const violations: string[] = [];

    for (const filePath of sourceFiles(sourceRoot)) {
      const sourceArea = area(filePath);
      const isModuleController = sourceArea.kind === "modules" && filePath.endsWith("-controller.ts");
      if (sourceArea.kind === "modules" && importsNamedFrom(filePath, "react", "useSyncExternalStore")) {
        violations.push(`${path.relative(projectRoot, filePath)} imports raw useSyncExternalStore`);
      }
      for (const specifier of importedSpecifiers(filePath)) {
        const resolved = resolveProjectImport(filePath, specifier);
        const targetArea = resolved ? area(resolved) : null;

        if (specifier.startsWith("..")) {
          violations.push(`${path.relative(projectRoot, filePath)} uses parent-relative import ${specifier}`);
        }
        if (
          targetArea &&
          applicationLayers.has(sourceArea.kind) &&
          applicationLayers.has(targetArea.kind) &&
          !canImport(sourceArea, targetArea, filePath)
        ) {
          violations.push(
            `${path.relative(projectRoot, filePath)} imports forbidden layer ${targetArea.kind} via ${specifier}`,
          );
        }
        if (sourceArea.kind === "modules" && !isModuleController && /@\/shared-state\/(?:internal|external-store|tasks-store|ui-store|broadcast-bridge)(?:\/|$)/.test(specifier)) {
          violations.push(`${path.relative(projectRoot, filePath)} imports internal Shared State via ${specifier}`);
        }
      }

      if (sourceArea.kind === "modules" && path.basename(filePath) === "index.ts") {
        for (const specifier of importedSpecifiers(filePath)) {
          if (specifier.includes("controller")) {
            violations.push(`${path.relative(projectRoot, filePath)} exposes a module controller`);
          }
        }
      }
    }

    expect(fs.existsSync(path.join(sourceRoot, "core"))).toBe(false);

    expect(violations).toEqual([]);
  });
});
