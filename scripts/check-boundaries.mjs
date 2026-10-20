import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const sourceExtensions = new Set([".ts", ".tsx", ".js", ".mjs", ".cjs", ".mts", ".cts"]);
const forbiddenGlobals = new Set([
  "Date", "performance", "process", "crypto", "document", "window", "navigator",
  "localStorage", "sessionStorage", "indexedDB", "fetch", "XMLHttpRequest", "WebSocket",
  "Worker", "SharedWorker", "BroadcastChannel", "EventSource", "setTimeout", "setInterval",
  "setImmediate", "clearTimeout", "clearInterval", "requestAnimationFrame", "queueMicrotask",
  "eval", "Function", "require", "Deno", "Bun",
]);
const inside = (base, path) => { const rel = relative(base, path); return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel)); };
const walk = (directory) => !existsSync(directory) ? [] : readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const path = resolve(directory, entry.name);
  return entry.isDirectory() ? walk(path) : sourceExtensions.has(extname(path)) ? [path] : [];
});
function resolveLocal(path) {
  const stem = path.replace(/\.(?:mjs|cjs|js)$/, "");
  return [path, ...[".ts", ".mts", ".cts", ".tsx", ".js", ".mjs", ".json"].map((ext) => stem + ext),
    ...["index.ts", "index.js"].map((name) => resolve(path, name))].find((candidate) => existsSync(candidate) && statSync(candidate).isFile());
}

/** Static architecture guard, including imports through contracts and deterministic utilities.
 * This is a source guard, not a JavaScript sandbox for untrusted policy code.
 */
export function checkBoundaries(root) {
  root = resolve(root);
  const errors = new Set();
  const core = resolve(root, "src/core");
  const contracts = resolve(root, "contracts");
  const agents = resolve(root, "src/agents");
  for (const [kind, directory] of [["core", core], ["agents", agents]]) {
    const seen = new Set();
    const visit = (path, chain = []) => {
      if (seen.has(path) || !sourceExtensions.has(extname(path))) return;
      seen.add(path);
      const source = ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.Latest, true);
      const report = (node, message) => {
        const { line } = source.getLineAndCharacterOfPosition(node.getStart(source));
        errors.add(`${kind}: ${relative(root, path).replaceAll("\\", "/")}:${line + 1}: ${message}${chain.length ? ` (via ${chain.join(" -> ")})` : ""}`);
      };
      const dependency = (node, specifier) => {
        if (!specifier.startsWith(".")) {
          if (kind === "core" && (specifier === "ajv" || /^ajv\/dist\/(?:2020|ajv)\.js$/.test(specifier))) return;
          if (kind === "core" && specifier === "node:crypto") {
            // Only deterministic hashing is allowed; randomBytes and UUID APIs are not.
            const bindings = ts.isImportDeclaration(node) && node.importClause?.namedBindings;
            if (bindings && ts.isNamedImports(bindings) && bindings.elements.every((entry) => (entry.propertyName ?? entry.name).text === "createHash")) return;
          }
          report(node, `forbidden import ${specifier}`);
          return;
        }
        const target = resolveLocal(resolve(dirname(path), specifier));
        if (!target) { report(node, `unresolved local import ${specifier}`); return; }
        if (!(inside(core, target) || inside(contracts, target) || (kind === "agents" && inside(agents, target)))) {
          report(node, `forbidden import ${specifier}`);
          return;
        }
        visit(target, [...chain, relative(root, path).replaceAll("\\", "/")]);
      };
      const scan = (node) => {
        if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) dependency(node, node.moduleSpecifier.text);
        if (ts.isImportEqualsDeclaration(node)) report(node, "import aliases are not permitted");
        if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) report(node, "dynamic imports are not permitted");
        if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument) && ts.isStringLiteral(node.argument.literal)) dependency(node, node.argument.literal.text);
        if (ts.isIdentifier(node) && forbiddenGlobals.has(node.text)) {
          // Ignore names used purely as object/interface keys, but inspect all actual references.
          const parent = node.parent;
          const keyOnly = (ts.isPropertySignature(parent) || ts.isPropertyAssignment(parent) || ts.isMethodSignature(parent)) && parent.name === node;
          const importName = ts.isImportSpecifier(parent) || ts.isImportClause(parent);
          if (!keyOnly && !importName) report(node, `forbidden ambient API ${node.text}`);
        }
        if (ts.isIdentifier(node) && ["globalThis", "global", "self"].includes(node.text)) report(node, `ambient global access ${node.text} is not permitted`);
        if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "console" && ["time", "timeLog", "timeEnd", "timeStamp"].includes(node.name.text)) report(node, "console clock APIs are not permitted");
        if (ts.isIdentifier(node) && node.text === "Math") {
          const parent = node.parent;
          if (ts.isPropertyAccessExpression(parent) && parent.expression === node && parent.name.text !== "random") { /* deterministic Math member */ }
          else report(node, "Math.random or aliased/computed Math access is not permitted");
        }
        ts.forEachChild(node, scan);
      };
      scan(source);
    };
    for (const path of walk(directory)) visit(path);
  }
  return [...errors].sort();
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const errors = checkBoundaries(resolve(dirname(fileURLToPath(import.meta.url)), ".."));
  if (errors.length) { console.error(errors.join("\n")); process.exitCode = 1; }
  else console.log("Import boundaries passed: core and agents have deterministic dependency paths.");
}
