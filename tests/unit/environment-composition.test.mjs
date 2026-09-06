import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

test("production environment plates are not obscured by legacy decorative overlays", () => {
  const nesmen = read("src/scenes/NesmenScene.js");
  const besednice = read("src/scenes/BesedniceScene.js");
  const slavia = read("src/scenes/SlaviaScene.js");

  assert.match(nesmen, /terrain-nesmen-excavated-sand-v1/);
  assert.doesNotMatch(nesmen, /const trail = new THREE\.Mesh/);
  assert.doesNotMatch(nesmen, /addDecorModel\(root, "model-nesmen-tree-stump"/);

  assert.match(besednice, /terrain-besednice-clay-quarry-v1/);
  assert.doesNotMatch(besednice, /addDecorModel\(root, "model-besednice-rock"/);

  assert.match(slavia, /terrain-slavia-malse-exterior-v1/);
  assert.match(slavia, /building\.visible = false/);
});
