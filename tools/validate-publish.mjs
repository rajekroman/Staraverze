import { lstat, readFile, readdir, realpath } from "node:fs/promises";
import path from "node:path";
import {
  DISTRIBUTION_NOTICE_FILES,
  DIST_DIR,
  FORBIDDEN_PUBLISH_NAMES,
  OFFLINE_CORE_FILES,
  PUBLISH_FILES,
  REQUIRED_RUNTIME_FILES
} from "./publish-files.mjs";

const root = path.resolve(process.cwd());
const rootReal = await realpath(root);
const dist = path.resolve(root, DIST_DIR);
const posix = value => value.split(path.sep).join("/");
const inside = (parent, child) => child === parent || child.startsWith(parent + path.sep);

async function assertSafeSource(relative) {
  const source = path.resolve(root, relative);
  if (!inside(root, source) || inside(dist, source)) throw new Error(`Invalid publish source path: ${relative}`);
  let cursor = root;
  for (const segment of relative.split("/")) {
    if (!segment || segment === "." || segment === "..") throw new Error(`Invalid publish source segment: ${relative}`);
    cursor = path.join(cursor, segment);
    const entry = await lstat(cursor);
    if (entry.isSymbolicLink()) throw new Error(`Publish source must not contain symbolic links: ${relative}`);
  }
  const canonical = await realpath(source);
  if (!inside(rootReal, canonical)) throw new Error(`Publish source resolves outside repository: ${relative}`);
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  entries.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
  const files = [];
  for (const entry of entries) {
    const full = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Symbolic links are forbidden in publish directory: ${full}`);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (entry.isFile()) files.push(posix(path.relative(dist, full)));
    else throw new Error(`Unexpected non-file entry in publish directory: ${full}`);
  }
  return files;
}

for (const file of PUBLISH_FILES) await assertSafeSource(file);

const distInfo = await lstat(dist).catch(error => {
  if (error.code === "ENOENT") return null;
  throw error;
});
if (!distInfo?.isDirectory() || distInfo.isSymbolicLink()) {
  throw new Error(`Missing or unsafe publish directory: ${DIST_DIR}/. Run npm run build:publish first.`);
}

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

for (const required of [...REQUIRED_RUNTIME_FILES, ...DISTRIBUTION_NOTICE_FILES]) {
  if (!actual.includes(required)) throw new Error(`Missing required distributed file: ${required}`);
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

const [html, style, game, manifestText, sw] = await Promise.all([
  readFile(path.join(dist, "index.html"), "utf8"),
  readFile(path.join(dist, "style.css"), "utf8"),
  readFile(path.join(dist, "game.js"), "utf8"),
  readFile(path.join(dist, "manifest.webmanifest"), "utf8"),
  readFile(path.join(dist, "sw.js"), "utf8")
]);

function normalizeFileReference(raw, label) {
  const value = raw.trim().replace(/^['"]|['"]$/g, "");
  if (!value || /^(?:https?:|mailto:|tel:|data:|blob:|#)/i.test(value)) return null;
  if (value.startsWith("/")) throw new Error(`Root-absolute ${label} URL breaks project Pages paths: ${value}`);
  const filePart = value.split(/[?#]/)[0];
  if (!filePart || filePart === "." || filePart === "./") return null;
  const normalized = path.posix.normalize(filePart.replace(/^\.\//, ""));
  if (normalized === ".." || normalized.startsWith("../")) throw new Error(`${label} URL escapes publish root: ${value}`);
  return normalized;
}

function requirePublishedReference(raw, label) {
  const file = normalizeFileReference(raw, label);
  if (file && !actual.includes(file)) throw new Error(`${label} references missing publish file: ${raw}`);
}

for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) requirePublishedReference(match[1], "HTML");
for (const match of style.matchAll(/url\(([^)]+)\)/g)) requirePublishedReference(match[1], "CSS");

const referencedAssets = new Set(
  [html, style, game].flatMap(text => [...text.matchAll(/(?:\.\/)?assets\/[A-Za-z0-9_./-]+/g)].map(match => match[0].replace(/^\.\//, "")))
);
for (const asset of referencedAssets) {
  if (!actual.includes(asset)) throw new Error(`Runtime references missing publish asset: ${asset}`);
}

const manifest = JSON.parse(manifestText);
for (const url of [manifest.start_url, manifest.scope, ...(manifest.shortcuts || []).map(shortcut => shortcut.url)].filter(Boolean)) {
  normalizeFileReference(url, "manifest navigation");
}
for (const icon of [
  ...(manifest.icons || []),
  ...(manifest.shortcuts || []).flatMap(shortcut => shortcut.icons || [])
]) {
  if (icon?.src) requirePublishedReference(icon.src, "manifest icon");
}

if (!/serviceWorker\.register\(\s*["']\.\/sw\.js["']/.test(game)) {
  throw new Error("Service worker must be registered with a project-relative ./sw.js URL.");
}

const coreBlock = sw.match(/const CORE = \[([\s\S]*?)\];/);
if (!coreBlock) throw new Error("Unable to locate service-worker CORE allowlist.");
const cached = [...coreBlock[1].matchAll(/"([^"]+)"/g)].map(match => match[1]).sort();
const expectedCached = ["./", ...OFFLINE_CORE_FILES.map(file => `./${file}`)].sort();

if (cached.length !== expectedCached.length || cached.some((value, index) => value !== expectedCached[index])) {
  const unexpected = cached.filter(value => !expectedCached.includes(value));
  const absent = expectedCached.filter(value => !cached.includes(value));
  throw new Error([
    "Service-worker CORE cache must match the runtime offline allowlist.",
    unexpected.length ? `Unexpected cache entries: ${unexpected.join(", ")}` : "",
    absent.length ? `Missing cache entries: ${absent.join(", ")}` : ""
  ].filter(Boolean).join("\n"));
}

if (sw.includes("AGENTS.md") || sw.includes("PRODUCTION_AUDIT.md") || sw.includes("BUILD_REPORT.txt") || sw.includes("./tests/") || sw.includes("./tools/")) {
  throw new Error("Service worker references internal development content.");
}

console.log(`Validated clean ${DIST_DIR}/ publish set with ${actual.length} files, required notices, no symlinks, and project-relative /Staraverze/ paths.`);
