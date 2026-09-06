import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const rootUrl = new URL("../../", import.meta.url);
const read = path => fs.readFileSync(new URL(path, rootUrl), "utf8");
const manifest = JSON.parse(read("assets/manifests/assets.json"));

test("realistic NPC v2 files are declared with stable IDs and complete asset metadata", () => {
  const expected = Object.freeze({
    "npc-farmer-vaclav": "farmer-vaclav-v2.png",
    "npc-forester-jan": "forester-jan-v2.png",
    "npc-rival-karel": "rival-karel-v2.png",
    "npc-expert-eva": "expert-eva-v2.png",
    "npc-thief-franta": "thief-franta-v2.png"
  });

  for (const [id, file] of Object.entries(expected)) {
    const entry = manifest.find(candidate => candidate.id === id);
    assert.ok(entry, id);
    assert.equal(entry.url, `./assets/sprites/npcs/${file}`);
    assert.deepEqual(entry.dimensions, { width: 256, height: 384 });
    assert.ok(entry.metrics.bytes > 0 && entry.metrics.bytes <= entry.budget.bytes, id);
    assert.match(entry.sha256, /^[a-f0-9]{64}$/);
    assert.match(entry.disposeOwner, /^LevelScene:/);
  }
});

test("player and NPC sprites share one visual size and foot anchor in every production scene", () => {
  for (const path of [
    "src/scenes/ChlumScene.js",
    "src/scenes/NesmenScene.js",
    "src/scenes/BesedniceScene.js",
    "src/scenes/SlaviaScene.js"
  ]) {
    const scene = read(path);
    const normalizedSprites = scene.match(/width:\s*82,?\s*height:\s*108[\s\S]{0,100}?anchorX:\s*0\.5,?\s*anchorY:\s*0\.08/g) ?? [];
    assert.ok(normalizedSprites.length >= 2, `${path} must normalize player and NPC sprite size`);
  }
});
