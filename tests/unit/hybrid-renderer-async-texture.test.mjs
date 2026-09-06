import test from "node:test";
import assert from "node:assert/strict";
import { HybridRenderer, prepareSpriteTexture } from "../../src/render/HybridRenderer.js";

const vector = () => ({
  x: 0,
  y: 0,
  z: 0,
  set(x, y, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  },
  setScalar(value) {
    this.x = value;
    this.y = value;
    this.z = value;
  }
});

class Node {
  constructor() {
    this.children = [];
    this.parent = null;
    this.position = vector();
    this.scale = vector();
    this.rotation = { z: 0 };
    this.userData = {};
  }

  add(child) {
    child.parent = this;
    this.children.push(child);
  }

  remove(child) {
    this.children = this.children.filter(entry => entry !== child);
    child.parent = null;
  }

  traverse(callback) {
    callback(this);
    for (const child of this.children) child.traverse?.(callback);
  }
}

class FakeRenderer {
  setClearColor() {}
  setPixelRatio() {}
  setSize() {}
  render() {}
  dispose() {}
}

class FakeCamera extends Node {
  constructor() {
    super();
    this.zoom = 1;
  }
  lookAt() {}
  updateProjectionMatrix() {}
}

class FakeSpriteMaterial {
  constructor(options) {
    Object.assign(this, options);
    this.needsUpdate = false;
  }
  dispose() {}
}

class FakeSprite extends Node {
  constructor(material) {
    super();
    this.material = material;
    this.center = vector();
    this.isSprite = true;
  }
}

const THREE = {
  WebGLRenderer: FakeRenderer,
  Scene: class extends Node {},
  OrthographicCamera: FakeCamera,
  Group: class extends Node {},
  SpriteMaterial: FakeSpriteMaterial,
  Sprite: FakeSprite
};

const createTexture = channel => ({
  isTexture: true,
  channel,
  needsUpdate: false,
  matrix: { elements: [1, 0, 0, 0, 1, 0, 0, 0, 1] },
  clone() {
    return createTexture(this.channel);
  },
  dispose() {}
});

test("prepareSpriteTexture normalizes a missing UV channel on the clone", () => {
  const source = createTexture(undefined);
  const result = prepareSpriteTexture(source);
  assert.notEqual(result, source);
  assert.equal(result.isTexture, true);
  assert.equal(result.channel, 0);
  assert.equal(result.needsUpdate, true);
  assert.deepEqual(result.matrix.elements, source.matrix.elements);
});

test("HybridRenderer resolves an AssetLoader promise before binding a sprite map", async () => {
  const renderer = new HybridRenderer({ three: THREE, canvas: {}, width: 390, height: 844 });
  const source = createTexture(undefined);
  const sprite = renderer.createSprite(Promise.resolve(source), {
    width: 58,
    height: 58,
    assetId: "finding-vltavin-besednice-hedgehog"
  });

  assert.equal(sprite.material.map, null);
  assert.equal(sprite.userData.assetId, "finding-vltavin-besednice-hedgehog");
  const resolved = await sprite.userData.textureReady;
  assert.equal(sprite.material.map, resolved);
  assert.notEqual(resolved, source);
  assert.equal(resolved.channel, 0);
  assert.equal(sprite.material.needsUpdate, true);
  assert.equal(sprite.scale.x, 58);
  assert.equal(sprite.scale.y, 58);
});
