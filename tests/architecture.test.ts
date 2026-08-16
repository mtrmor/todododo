import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(projectRoot, "src");

function sourceFiles(directory: string): string[] {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return sourceFiles(absolutePath);
    }

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
  return sourceFile.statements.some(
    (statement) =>
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
  if (specifier.startsWith("@/")) {
    return path.join(sourceRoot, specifier.slice(2));
  }

  if (specifier.startsWith(".")) {
    return path.resolve(path.dirname(fromFile), specifier);
  }

  return null;
}

function isStaticStyleExpression(node: ts.Expression): boolean {
  if (
    ts.isStringLiteral(node) ||
    ts.isNumericLiteral(node) ||
    node.kind === ts.SyntaxKind.TrueKeyword ||
    node.kind === ts.SyntaxKind.FalseKeyword ||
    node.kind === ts.SyntaxKind.NullKeyword
  ) {
    return true;
  }

  if (ts.isPrefixUnaryExpression(node)) {
    return isStaticStyleExpression(node.operand);
  }

  if (ts.isArrayLiteralExpression(node)) {
    return node.elements.every(
      (element) => ts.isExpression(element) && isStaticStyleExpression(element),
    );
  }

  if (ts.isObjectLiteralExpression(node)) {
    return node.properties.every(
      (property) =>
        ts.isPropertyAssignment(property) && isStaticStyleExpression(property.initializer),
    );
  }

  return false;
}

function staticInlineStyleLines(filePath: string): number[] {
  const sourceFile = ts.createSourceFile(
    filePath,
    fs.readFileSync(filePath, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const lines: number[] = [];
  function visit(node: ts.Node): void {
    if (
      ts.isJsxAttribute(node) &&
      ts.isIdentifier(node.name) &&
      (node.name.text === "style" || node.name.text === "contentContainerStyle") &&
      node.initializer &&
      ts.isJsxExpression(node.initializer) &&
      node.initializer.expression &&
      ts.isObjectLiteralExpression(node.initializer.expression) &&
      isStaticStyleExpression(node.initializer.expression)
    ) {
      lines.push(sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1);
    }

    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return lines;
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
  it("keeps Shared State independent from Platform", () => {
    const violations = sourceFiles(path.join(sourceRoot, "shared-state")).flatMap((filePath) =>
      importedSpecifiers(filePath)
        .filter((specifier) => /^@\/platform(?:\/|$)/.test(specifier))
        .map(
          (specifier) =>
            `${path.relative(projectRoot, filePath)} imports Platform via ${specifier}`,
        ),
    );

    expect(violations).toEqual([]);
  });

  it("enforces the application dependency graph", () => {
    const violations: string[] = [];

    for (const filePath of sourceFiles(sourceRoot)) {
      const sourceArea = area(filePath);
      const isModuleController =
        sourceArea.kind === "modules" && filePath.endsWith("-controller.ts");

      if (
        sourceArea.kind === "modules" &&
        importsNamedFrom(filePath, "react", "useSyncExternalStore")
      ) {
        violations.push(`${path.relative(projectRoot, filePath)} imports raw useSyncExternalStore`);
      }

      for (const specifier of importedSpecifiers(filePath)) {
        const resolved = resolveProjectImport(filePath, specifier);
        const targetArea = resolved ? area(resolved) : null;

        if (specifier.startsWith("..")) {
          violations.push(
            `${path.relative(projectRoot, filePath)} uses parent-relative import ${specifier}`,
          );
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

        if (
          sourceArea.kind === "modules" &&
          !isModuleController &&
          /@\/shared-state\/(?:internal|external-store|tasks-store|ui-store|broadcast-bridge)(?:\/|$)/.test(
            specifier,
          )
        ) {
          violations.push(
            `${path.relative(projectRoot, filePath)} imports internal Shared State via ${specifier}`,
          );
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
    expect(fs.existsSync(path.join(sourceRoot, "root", "ui"))).toBe(false);

    expect(violations).toEqual([]);
  });

  it("keeps the Platform UI kit isolated behind its public subpath", () => {
    const uiRoot = path.join(sourceRoot, "platform", "ui");
    const violations: string[] = [];

    expect(fs.existsSync(uiRoot)).toBe(true);

    for (const filePath of sourceFiles(uiRoot)) {
      for (const specifier of importedSpecifiers(filePath)) {
        if (/^@\/(?:modules|root|shared-state)(?:\/|$)/.test(specifier)) {
          violations.push(
            `${path.relative(projectRoot, filePath)} imports forbidden UI dependency ${specifier}`,
          );
        }
      }
    }

    const platformBarrel = fs.readFileSync(path.join(sourceRoot, "platform", "index.ts"), "utf8");
    expect(platformBarrel).not.toContain("platform/ui");
    expect(violations).toEqual([]);
  });

  it("keeps module UI components and styles in the module-local layout", () => {
    const modulesRoot = path.join(sourceRoot, "modules");
    const violations: string[] = [];

    for (const moduleEntry of fs.readdirSync(modulesRoot, { withFileTypes: true })) {
      if (!moduleEntry.isDirectory()) {
        continue;
      }

      const moduleRoot = path.join(modulesRoot, moduleEntry.name);
      const rootComponents = fs.readdirSync(moduleRoot).filter((name) => name.endsWith(".tsx"));

      if (rootComponents.length > 0) {
        const rootStyles = path.join(moduleRoot, "styles.ts");

        if (!fs.existsSync(rootStyles)) {
          violations.push(`${path.relative(projectRoot, moduleRoot)} is missing styles.ts`);
        } else if (!/StyleSheet\.create\s*\(/.test(fs.readFileSync(rootStyles, "utf8"))) {
          violations.push(
            `${path.relative(projectRoot, rootStyles)} does not use StyleSheet.create`,
          );
        }
      }

      const componentsRoot = path.join(moduleRoot, "components");

      if (fs.existsSync(componentsRoot)) {
        for (const componentEntry of fs.readdirSync(componentsRoot, { withFileTypes: true })) {
          if (!componentEntry.isDirectory()) {
            violations.push(
              `${path.relative(projectRoot, componentsRoot)} contains non-directory ${componentEntry.name}`,
            );
            continue;
          }

          const componentRoot = path.join(componentsRoot, componentEntry.name);
          const componentFile = path.join(componentRoot, `${componentEntry.name}.tsx`);
          const stylesFile = path.join(componentRoot, "styles.ts");

          if (!fs.existsSync(componentFile)) {
            violations.push(
              `${path.relative(projectRoot, componentRoot)} is missing ${componentEntry.name}.tsx`,
            );
          }

          if (!fs.existsSync(stylesFile)) {
            violations.push(`${path.relative(projectRoot, componentRoot)} is missing styles.ts`);
          } else if (!/StyleSheet\.create\s*\(/.test(fs.readFileSync(stylesFile, "utf8"))) {
            violations.push(
              `${path.relative(projectRoot, stylesFile)} does not use StyleSheet.create`,
            );
          }
        }
      }

      const indexPath = path.join(moduleRoot, "index.ts");

      if (fs.existsSync(indexPath)) {
        for (const specifier of importedSpecifiers(indexPath)) {
          if (specifier.includes("/components/")) {
            violations.push(
              `${path.relative(projectRoot, indexPath)} exports internal component ${specifier}`,
            );
          }
        }
      }

      for (const filePath of sourceFiles(moduleRoot)) {
        if (filePath.endsWith(".tsx")) {
          for (const line of staticInlineStyleLines(filePath)) {
            violations.push(
              `${path.relative(projectRoot, filePath)}:${line} contains a static inline style`,
            );
          }
        }

        if (path.basename(path.dirname(filePath)) === "hooks") {
          const hooksRoot = path.dirname(filePath);
          const hooksParent = path.dirname(hooksRoot);
          const validRootHooks = hooksParent === moduleRoot;
          const validComponentHooks = path.dirname(hooksParent) === componentsRoot;

          if (!validRootHooks && !validComponentHooks) {
            violations.push(
              `${path.relative(projectRoot, filePath)} is outside a component-local hooks folder`,
            );
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
