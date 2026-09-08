import { copyFile, mkdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { DIST_DIR, PUBLISH_FILES } from "./publish-files.mjs";

const root = path.resolve(process.cwd());
const dist = path.resolve(root, DIST_DIR);

if (path.dirname(dist) !== root || path.basename(dist) !== DIST_DIR) {
  throw new Error(`Refusing to clean unexpected publish directory: ${dist}`);
}

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const relative of PUBLISH_FILES) {
  const source = path.resolve(root, relative);
  const destination = path.resolve(dist, relative);
  if (!source.startsWith(root + path.sep) || source.startsWith(dist + path.sep)) {
    throw new Error(`Invalid publish source path: ${relative}`);
  }
  if (!destination.startsWith(dist + path.sep)) {
    throw new Error(`Invalid publish destination path: ${relative}`);
  }
  const info = await stat(source);
  if (!info.isFile()) throw new Error(`Publish allowlist entry is not a file: ${relative}`);
  await mkdir(path.dirname(destination), { recursive: true });
  await copyFile(source, destination);
}

console.log(`Built ${PUBLISH_FILES.length} runtime files into ${DIST_DIR}/`);
