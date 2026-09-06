const materialList = material => Array.isArray(material) ? material : [material];

export function disposeTexture(texture) {
  texture?.dispose?.();
}

export function disposeObject3D(root) {
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();

  root?.traverse?.(node => {
    if (node.geometry?.dispose) geometries.add(node.geometry);
    for (const material of materialList(node.material)) {
      if (!material?.dispose) continue;
      materials.add(material);
      for (const value of Object.values(material)) {
        if (value?.isTexture && value.dispose) textures.add(value);
      }
    }
  });

  for (const geometry of geometries) geometry.dispose();
  for (const texture of textures) texture.dispose();
  for (const material of materials) material.dispose();
}

export function cloneTexture(texture) {
  if (!texture?.isTexture || typeof texture.clone !== "function") return texture;
  const clone = texture.clone();
  clone.needsUpdate = true;
  return clone;
}
