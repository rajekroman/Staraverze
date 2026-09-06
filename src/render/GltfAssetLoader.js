import { GLTFLoader } from "../../vendor/three/addons/loaders/GLTFLoader.js";

export const GLTF_LOADER_REVISION = "185";

export class GltfAssetLoader {
  constructor(options = {}) {
    this.loader = options.loader ?? new GLTFLoader(options.manager);
  }

  async load(entry) {
    if (!entry?.id || entry.type !== "gltf" || !entry.url) throw new TypeError("GLTF asset entry requires id, type gltf and url.");
    const gltf = await this.loader.loadAsync(entry.url);
    const scene = gltf.scene ?? gltf.scenes?.[0];
    if (!scene?.isObject3D) throw new Error(`GLTF asset ${entry.id} has no scene.`);
    scene.userData.assetId = entry.id;
    scene.userData.gltfLoaderRevision = GLTF_LOADER_REVISION;
    scene.animations = gltf.animations ?? [];
    return scene;
  }

  async parse(data, path = "") {
    const gltf = await this.loader.parseAsync(data, path);
    const scene = gltf.scene ?? gltf.scenes?.[0];
    if (!scene?.isObject3D) throw new Error("Parsed GLTF has no scene.");
    scene.userData.gltfLoaderRevision = GLTF_LOADER_REVISION;
    scene.animations = gltf.animations ?? [];
    return scene;
  }
}
