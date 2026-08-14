import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { extname, join, relative } from "node:path";

const projectRoot = new URL("..", import.meta.url).pathname;
const distRoot = join(projectRoot, "dist");
const clientRoot = join(distRoot, "client");
const serverRoot = join(distRoot, "server");
const routesPath = join(serverRoot, "_expo", "routes.json");
const apiRoutePath = join(
  serverRoot,
  "_expo",
  "functions",
  "api",
  "[...path]+api.js",
);

function fail(message) {
  throw new Error(`Web export check failed: ${message}`);
}

function filesUnder(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(path) : [path];
  });
}

if (!existsSync(routesPath) || !existsSync(apiRoutePath)) {
  fail("server routes or the catch-all API function are missing");
}

const routes = JSON.parse(readFileSync(routesPath, "utf8"));
const csp = routes.headers?.["Content-Security-Policy"];
if (typeof csp !== "string") {
  fail("Content-Security-Policy is missing");
}
if (!csp.includes("connect-src 'self'") || csp.includes("'unsafe-eval'")) {
  fail("CSP does not keep network access same-origin or permits unsafe-eval");
}

const htmlFiles = filesUnder(serverRoot).filter((file) => extname(file) === ".html");
for (const htmlFile of htmlFiles) {
  const html = readFileSync(htmlFile, "utf8");
  const inlineScripts = html.matchAll(
    /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/giu,
  );

  for (const match of inlineScripts) {
    if (!match[1]) continue;
    const hash = createHash("sha256").update(match[1]).digest("base64");
    if (!csp.includes(`'sha256-${hash}'`)) {
      fail(
        `${relative(projectRoot, htmlFile)} contains an inline script without a CSP hash`,
      );
    }
  }
}

const clientFiles = filesUnder(clientRoot);
const clientJavaScript = clientFiles
  .filter((file) => extname(file) === ".js")
  .map((file) => readFileSync(file, "utf8"))
  .join("\n");

for (const forbidden of [
  "EXPO_PUBLIC_SUPABASE_URL",
  "EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_FUNCTION_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "/rest/v1",
  "service_role",
]) {
  if (clientJavaScript.includes(forbidden)) {
    fail(`client JavaScript contains forbidden server/data marker: ${forbidden}`);
  }
}

const bundledFonts = clientFiles.filter((file) => extname(file) === ".ttf");
if (bundledFonts.length !== 4) {
  fail(`expected 4 local font files, found ${bundledFonts.length}`);
}

console.log(
  `Web export check passed: ${htmlFiles.length} HTML routes, API proxy, CSP hashes, four fonts, and no client Supabase configuration.`,
);
