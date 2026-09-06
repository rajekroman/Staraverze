const cloneTexture = (texture, cache) => {
  if (!texture?.isTexture || typeof texture.clone !== "function") return texture;
  const cached = cache.get(texture);
  if (cached) return cached;
  const cloned = texture.clone();
  cloned.needsUpdate = true;
  cache.set(texture, cloned);
  return cloned;
};

const cloneMaterialEntry = (material, textureCache) => {
  const cloned = material?.clone?.() ?? material;
  if (!cloned || cloned === material) return cloned;
  for (const key of Object.keys(cloned)) {
    if (cloned[key]?.isTexture) cloned[key] = cloneTexture(cloned[key], textureCache);
  }
  return cloned;
};

const cloneMaterial = (material, textureCache) => Array.isArray(material)
  ? material.map(entry => cloneMaterialEntry(entry, textureCache))
  : cloneMaterialEntry(material, textureCache);

export class ModelFactory {
  constructor(options = {}) {
    this.renderer = options.renderer;
    if (!this.renderer?.bindEntity || !this.renderer?.disposeObject) {
      throw new TypeError("ModelFactory requires a ThreeRenderer-compatible renderer.");
    }
  }

  clone(source, options = {}) {
    if (!source?.clone) throw new TypeError("ModelFactory source must be a Three.js Object3D.");
    const model = source.clone(true);
    const textureCache = new WeakMap();
    model.traverse(node => {
      if (node.geometry?.clone) node.geometry = node.geometry.clone();
      if (node.material) node.material = cloneMaterial(node.material, textureCache);
    });
    model.position.set(options.x ?? 0, options.y ?? 0, options.z ?? 0);
    model.rotation.set(options.rotationX ?? 0, options.rotationY ?? 0, options.rotationZ ?? 0);
    if (typeof options.scale === "number") model.scale.setScalar(options.scale);
    else if (options.scale) model.scale.set(options.scale.x ?? 1, options.scale.y ?? 1, options.scale.z ?? 1);
    model.userData.assetId = options.assetId ?? source.userData?.assetId ?? null;
    return model;
  }

  bind(entity, source, options = {}) {
    const model = this.clone(source, options);
    this.renderer.bindEntity(entity, model, options.layer ?? "actors");
    return model;
  }

  dispose(model) {
    this.renderer.disposeObject(model);
  }
}
