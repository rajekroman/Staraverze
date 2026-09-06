import test from "node:test";
import assert from "node:assert/strict";
import { AssetLoader } from "../../src/core/AssetLoader.js";

class EventSink {
  constructor() { this.items = []; }
  emit(type, payload) { this.items.push({ type, payload }); }
}

test("AssetLoader vybírá preload z level.assetGroups a zachová manifestový typ spritesheet", async () => {
  const events = new EventSink();
  const assets = new AssetLoader({ events });
  const loadedTypes = [];
  assets.register("texture", async entry => { loadedTypes.push(entry.type); return { id: entry.id }; });
  assets.register("spritesheet", async entry => { loadedTypes.push(entry.type); return { id: entry.id }; });
  assets.register("gltf", async entry => { loadedTypes.push(entry.type); return { id: entry.id }; });
  assets.setManifest([
    { id: "player-hunter-walk", type: "spritesheet", url: "./player.png", preload: "common" },
    { id: "field", type: "texture", url: "./field.png", preload: "level:chlum" },
    { id: "tractor", type: "gltf", url: "./tractor.glb", preload: "level:chlum" },
    { id: "forest", type: "texture", url: "./forest.png", preload: "level:nesmen" }
  ]);

  const selected = assets.selectPreload(["common", "level:chlum"]);
  assert.deepEqual(selected.map(entry => entry.id), ["player-hunter-walk", "field", "tractor"]);
  const loaded = await assets.preloadLevel({ assetGroups: ["common", "level:chlum"] });

  assert.deepEqual([...loaded.keys()], ["player-hunter-walk", "field", "tractor"]);
  assert.deepEqual(loadedTypes.sort(), ["gltf", "spritesheet", "texture"]);
  assert.equal(assets.cachedEntry("player-hunter-walk").type, "spritesheet");
  assert.equal(assets.has("player-hunter-walk", "spritesheet"), true);
  assert.equal(assets.has("player-hunter-walk", "texture"), false);
  assert.deepEqual(await assets.get("player-hunter-walk"), { id: "player-hunter-walk" });

  const playerEvents = events.items.filter(item => item.payload.id === "player-hunter-walk");
  assert.deepEqual(playerEvents.map(item => [item.type, item.payload.type]), [
    ["asset:load:start", "spritesheet"],
    ["asset:load:complete", "spritesheet"]
  ]);
});

test("AssetLoader emituje kanonický HTTP error a retry nepoužije neúspěšný cache record", async () => {
  const events = new EventSink();
  const assets = new AssetLoader({ events });
  let attempts = 0;
  assets.register("gltf", async () => {
    attempts++;
    if (attempts === 1) throw new Error("HTTP 404 for ./missing.glb");
    return { recovered: true };
  });
  const entry = { id: "fixture", type: "gltf", url: "./missing.glb", preload: "test" };

  await assert.rejects(assets.load(entry), /HTTP 404/);
  assert.equal(assets.has("fixture", "gltf"), false);
  assert.deepEqual(events.items.at(-1), {
    type: "asset:load:error",
    payload: { id: "fixture", type: "gltf", message: "HTTP 404 for ./missing.glb" }
  });
  assert.deepEqual(await assets.load(entry), { recovered: true });
  assert.equal(attempts, 2);
});

test("AssetLoader emituje kanonický error i při selhání parseru", async () => {
  const events = new EventSink();
  const assets = new AssetLoader({ events });
  assets.register("gltf", async () => { throw new Error("THREE.GLTFLoader: Unexpected end of JSON input"); });

  await assert.rejects(
    assets.load({ id: "broken-glb", type: "gltf", url: "./broken.glb" }),
    /Unexpected end of JSON input/
  );
  assert.deepEqual(events.items.at(-1), {
    type: "asset:load:error",
    payload: {
      id: "broken-glb",
      type: "gltf",
      message: "THREE.GLTFLoader: Unexpected end of JSON input"
    }
  });
});

test("AssetLoader používá typový disposer pro cached source", async () => {
  const disposed = [];
  const assets = new AssetLoader();
  assets.register("gltf", async entry => ({ id: entry.id }), (asset, entry) => disposed.push([asset.id, entry.type]));
  assets.setManifest([{ id: "shared-model", type: "gltf", url: "./shared.glb", preload: "common" }]);
  await assets.preloadGroups("common");

  assert.equal(assets.unload("shared-model"), true);
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.deepEqual(disposed, [["shared-model", "gltf"]]);
  assert.equal(assets.has("shared-model"), false);
});

test("AssetLoader uvolní jen assety daného lifecycle ownera", async () => {
  const disposed = [];
  const assets = new AssetLoader();
  assets.register("texture", async entry => ({ id: entry.id }), asset => disposed.push(asset.id));
  assets.setManifest([
    { id: "player", type: "texture", url: "./player.png", preload: "common", disposeOwner: "GameApp" },
    { id: "field", type: "texture", url: "./field.png", preload: "level:chlum", disposeOwner: "LevelScene:chlum" }
  ]);
  await assets.preloadGroups(["common", "level:chlum"]);

  assert.equal(assets.unloadOwned(assets.entries(), "LevelScene:chlum"), 1);
  await new Promise(resolve => setTimeout(resolve, 0));

  assert.equal(assets.has("field"), false);
  assert.equal(assets.has("player"), true);
  assert.deepEqual(disposed, ["field"]);

  assets.clear();
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.deepEqual(disposed, ["field", "player"]);
});

test("AssetLoader odmítá duplicitní manifestové ID", () => {
  const assets = new AssetLoader();
  assert.throws(() => assets.setManifest([
    { id: "same", type: "texture", url: "./a.png" },
    { id: "same", type: "gltf", url: "./b.glb" }
  ]), /Duplicate asset manifest id/);
});
