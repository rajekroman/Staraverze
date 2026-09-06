import test from "node:test";
import assert from "node:assert/strict";
import { ModelFactory } from "../../src/render/ModelFactory.js";

class FakeTexture {
  constructor(name) {
    this.name = name;
    this.isTexture = true;
    this.needsUpdate = false;
    this.disposeCount = 0;
  }

  clone() {
    return new FakeTexture(`${this.name}-clone`);
  }

  dispose() {
    this.disposeCount += 1;
  }
}

class FakeMaterial {
  constructor(map, normalMap) {
    this.map = map;
    this.normalMap = normalMap;
    this.disposeCount = 0;
  }

  clone() {
    return new FakeMaterial(this.map, this.normalMap);
  }

  dispose() {
    this.disposeCount += 1;
  }
}

class FakeGeometry {
  constructor(name) {
    this.name = name;
    this.disposeCount = 0;
  }

  clone() {
    return new FakeGeometry(`${this.name}-clone`);
  }

  dispose() {
    this.disposeCount += 1;
  }
}

const vector = () => ({
  values: [0, 0, 0],
  set(x, y, z) { this.values = [x, y, z]; },
  setScalar(value) { this.values = [value, value, value]; }
});

class FakeObject3D {
  constructor({ geometry, material, children = [] } = {}) {
    this.geometry = geometry;
    this.material = material;
    this.children = children;
    this.position = vector();
    this.rotation = vector();
    this.scale = vector();
    this.userData = {};
  }

  clone(deep = false) {
    return new FakeObject3D({
      geometry: this.geometry,
      material: this.material,
      children: deep ? this.children.map(child => child.clone(true)) : []
    });
  }

  traverse(handler) {
    handler(this);
    for (const child of this.children) child.traverse(handler);
  }
}

const disposeLikeHybridRenderer = object => {
  object.traverse(node => {
    node.geometry?.dispose?.();
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    for (const material of materials) {
      if (!material) continue;
      for (const value of Object.values(material)) {
        if (value?.isTexture) value.dispose?.();
      }
      material.dispose?.();
    }
  });
};

test("ModelFactory isolates texture ownership between simultaneous model instances", () => {
  const sourceMap = new FakeTexture("source-map");
  const sourceNormalMap = new FakeTexture("source-normal-map");
  const sourceMaterial = new FakeMaterial(sourceMap, sourceNormalMap);
  const sourceGeometry = new FakeGeometry("source-geometry");
  const source = new FakeObject3D({ geometry: sourceGeometry, material: sourceMaterial });
  source.userData.assetId = "model-textured";

  const renderer = {
    bindEntity() {},
    disposeObject: disposeLikeHybridRenderer
  };
  const factory = new ModelFactory({ renderer });
  const first = factory.clone(source);
  const second = factory.clone(source);

  assert.notEqual(first.geometry, sourceGeometry);
  assert.notEqual(second.geometry, sourceGeometry);
  assert.notEqual(first.geometry, second.geometry);
  assert.notEqual(first.material, sourceMaterial);
  assert.notEqual(second.material, sourceMaterial);
  assert.notEqual(first.material, second.material);

  assert.notEqual(first.material.map, sourceMap);
  assert.notEqual(second.material.map, sourceMap);
  assert.notEqual(first.material.map, second.material.map);
  assert.notEqual(first.material.normalMap, sourceNormalMap);
  assert.notEqual(second.material.normalMap, sourceNormalMap);
  assert.notEqual(first.material.normalMap, second.material.normalMap);
  assert.equal(first.material.map.needsUpdate, true);
  assert.equal(second.material.map.needsUpdate, true);

  factory.dispose(first);
  assert.equal(first.material.map.disposeCount, 1);
  assert.equal(first.material.normalMap.disposeCount, 1);
  assert.equal(second.material.map.disposeCount, 0);
  assert.equal(second.material.normalMap.disposeCount, 0);
  assert.equal(sourceMap.disposeCount, 0);
  assert.equal(sourceNormalMap.disposeCount, 0);
});
