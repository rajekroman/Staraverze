import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { DIST_DIR, FORBIDDEN_PUBLISH_NAMES, PUBLISH_FILES, REQUIRED_RUNTIME_FILES } from "./publish-files.mjs";

const root = path.resolve(process.cwd());
const dist = path.resolve(root, DIST_DIR);
const posix = value => value.split(path.sep).join("/");

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  entries.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
  const files = [];
  for (const entry of entries) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (entry.isFile()) files.push(posix(path.relative(dist, full)));
    else throw new Error(`Unexpected non-file entry in publish directory: ${full}`);
  }
  return files;
}

const distInfo = await stat(dist).catch(() => null);
if (!distInfo?.isDirectory()) throw new Error(`Missing publish directory: ${DIST_DIR}/. Run npm run build:publish first.`);

const expected = [...PUBLISH_FILES].sort();
const actual = (await walk(dist)).sort();
const missing = expected.filter(file => !actual.includes(file));
const extra = actual.filter(file => !expected.includes(file));

if (missing.length || extra.length) {
  throw new Error([
    "Publish directory differs from the explicit runtime allowlist.",
    missing.length ? `Missing: ${missing.join(", ")}` : "",
    extra.length ? `Unexpected: ${extra.join(", ")}` : ""
  ].filter(Boolean).join("\n"));
}

for (const required of REQUIRED_RUNTIME_FILES) {
  if (!actual.includes(required)) throw new Error(`Missing required runtime file: ${required}`);
}

for (const file of actual) {
  const segments = file.split("/");
  if (FORBIDDEN_PUBLISH_NAMES.some(name => file === name || segments.includes(name))) {
    throw new Error(`Forbidden publish content: ${file}`);
  }
  if (file.endsWith(".map") || file.endsWith("~") || file.endsWith(".tmp")) {
    throw new Error(`Temporary/source-map file must not be published: ${file}`);
  }
}

const [html, game, manifestText, sw] = await Promise.all([
  readFile(path.join(dist, "index.html"), "utf8"),
  readFile(path.join(dist, "game.js"), "utf8"),
  readFile(path.join(dist, "manifest.webmanifest"), "utf8"),
  readFile(path.join(dist, "sw.js"), "utf8")
]);

const referencedAssets = new Set(
  [html, game].flatMap(text => [...text.matchAll(/(?:\.\/)?assets\/[A-Za-z0-9_./-]+/g)].map(match => match[0].replace(/^\.\//, "")))
);
for (const asset of referencedAssets) {
  if (!actual.includes(asset)) throw new Error(`Runtime references missing publish asset: ${asset}`);
}

for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  const url = match[1];
  if (/^(?:https?:|mailto:|tel:|#)/.test(url)) continue;
  if (url.startsWith("/")) throw new Error(`Root-absolute HTML URL breaks project Pages paths: ${url}`);
}

const manifest = JSON.parse(manifestText);
for (const url of [
  manifest.start_url,
  manifest.scope,
  ...(manifest.icons || []).map(icon => icon.src),
  ...(manifest.shortcuts || []).flatMap(shortcut => [shortcut.url, ...(shortcut.icons || []).map(icon => icon.src)])
].filter(Boolean)) {
  if (url.startsWith("/")) throw new Error(`Root-absolute manifest URL breaks /Staraverze/: ${url}`);
}

if (!/serviceWorker\.register\(\s*["']\.\/sw\.js["']/.test(game)) {
  throw new Error("Service worker must be registered with a project-relative ./sw.js URL.");
}

const coreBlock = sw.match(/const CORE = \[([\s\S]*?)\];/);
if (!coreBlock) throw new Error("Unable to locate service-worker CORE allowlist.");
const cached = [...coreBlock[1].matchAll(/"([^"]+)"/g)].map(match => match[1]).sort();
const expectedCached = [
  "./",
  ...PUBLISH_FILES
    .filter(file => file !== ".nojekyll" && file !== "sw.js")
    .map(file => `./${file}`)
].sort();

if (cached.length !== expectedCached.length || cached.some((value, index) => value !== expectedCached[index])) {
  const unexpected = cached.filter(value => !expectedCached.includes(value));
  const absent = expectedCached.filter(value => !cached.includes(value));
  throw new Error([
    "Service-worker CORE cache must match published runtime files.",
    unexpected.length ? `Unexpected cache entries: ${unexpected.join(", ")}` : "",
    absent.length ? `Missing cache entries: ${absent.join(", ")}` : ""
  ].filter(Boolean).join("\n"));
}

if (sw.includes("AGENTS.md") || sw.includes("PRODUCTION_AUDIT.md") || sw.includes("BUILD_REPORT.txt") || sw.includes("./tests/") || sw.includes("./tools/")) {
  throw new Error("Service worker references internal development content.");
}

console.log(`Validated clean ${DIST_DIR}/ publish set with ${actual.length} files and project-relative /Staraverze/ paths.`);
