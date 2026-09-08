import { copyFile, lstat, mkdir, realpath, rm } from "node:fs/promises";
import path from "node:path";
import { DIST_DIR, PUBLISH_FILES } from "./publish-files.mjs";

const root = path.resolve(process.cwd());
const rootReal = await realpath(root);
const dist = path.resolve(root, DIST_DIR);

const inside = (parent, child) => child === parent || child.startsWith(parent + path.sep);

if (path.dirname(dist) !== root || path.basename(dist) !== DIST_DIR) {
  throw new Error(`Refusing to clean unexpected publish directory: ${dist}`);
}

const existingDist = await lstat(dist).catch(error => {
  if (error.code === "ENOENT") return null;
  throw error;
});
if (existingDist?.isSymbolicLink()) {
  throw new Error(`Refusing to clean symbolic-link publish directory: ${dist}`);
}

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

async function assertSafeSource(relative) {
  if (!relative || path.isAbsolute(relative)) throw new Error(`Invalid publish source path: ${relative}`);
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
  const info = await lstat(source);
  if (!info.isFile()) throw new Error(`Publish allowlist entry is not a file: ${relative}`);
  return source;
}

for (const relative of PUBLISH_FILES) {
  const source = await assertSafeSource(relative);
  const destination = path.resolve(dist, relative);
  if (!inside(dist, destination) || destination === dist) throw new Error(`Invalid publish destination path: ${relative}`);
  await mkdir(path.dirname(destination), { recursive: true });
  await copyFile(source, destination);
}

console.log(`Built ${PUBLISH_FILES.length} explicitly allowlisted files into ${DIST_DIR}/`);
