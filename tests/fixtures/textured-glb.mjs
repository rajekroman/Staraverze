const PNG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/iZk9HQAAAABJRU5ErkJggg==";
const encoder = new TextEncoder();
const align4 = value => (value + 3) & ~3;

const decodeBase64 = value => {
  if (typeof Buffer !== "undefined") return new Uint8Array(Buffer.from(value, "base64"));
  const binary = atob(value);
  return Uint8Array.from(binary, character => character.charCodeAt(0));
};

export function createTexturedGlb() {
  const positions = new Float32Array([
    -0.5, -0.5, 0,
     0.5, -0.5, 0,
     0.0,  0.5, 0
  ]);
  const uvs = new Float32Array([0, 0, 1, 0, 0.5, 1]);
  const indices = new Uint16Array([0, 1, 2]);
  const png = decodeBase64(PNG_BASE64);

  const positionsOffset = 0;
  const uvOffset = positionsOffset + positions.byteLength;
  const indexOffset = uvOffset + uvs.byteLength;
  const imageOffset = align4(indexOffset + indices.byteLength);
  const binaryLength = align4(imageOffset + png.byteLength);
  const binary = new Uint8Array(binaryLength);
  binary.set(new Uint8Array(positions.buffer), positionsOffset);
  binary.set(new Uint8Array(uvs.buffer), uvOffset);
  binary.set(new Uint8Array(indices.buffer), indexOffset);
  binary.set(png, imageOffset);

  const json = {
    asset: { version: "2.0", generator: "lovec-vltavinu-asset-runtime-test" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, name: "textured-triangle" }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0, TEXCOORD_0: 1 }, indices: 2, material: 0 }] }],
    materials: [{ pbrMetallicRoughness: { baseColorTexture: { index: 0 }, metallicFactor: 0, roughnessFactor: 1 } }],
    textures: [{ source: 0 }],
    images: [{ bufferView: 3, mimeType: "image/png" }],
    buffers: [{ byteLength: binaryLength }],
    bufferViews: [
      { buffer: 0, byteOffset: positionsOffset, byteLength: positions.byteLength, target: 34962 },
      { buffer: 0, byteOffset: uvOffset, byteLength: uvs.byteLength, target: 34962 },
      { buffer: 0, byteOffset: indexOffset, byteLength: indices.byteLength, target: 34963 },
      { buffer: 0, byteOffset: imageOffset, byteLength: png.byteLength }
    ],
    accessors: [
      { bufferView: 0, componentType: 5126, count: 3, type: "VEC3", min: [-0.5, -0.5, 0], max: [0.5, 0.5, 0] },
      { bufferView: 1, componentType: 5126, count: 3, type: "VEC2" },
      { bufferView: 2, componentType: 5123, count: 3, type: "SCALAR" }
    ]
  };

  const jsonBytes = encoder.encode(JSON.stringify(json));
  const jsonLength = align4(jsonBytes.byteLength);
  const totalLength = 12 + 8 + jsonLength + 8 + binaryLength;
  const output = new Uint8Array(totalLength);
  const view = new DataView(output.buffer);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, totalLength, true);
  view.setUint32(12, jsonLength, true);
  view.setUint32(16, 0x4e4f534a, true);
  output.fill(0x20, 20, 20 + jsonLength);
  output.set(jsonBytes, 20);
  const binaryHeader = 20 + jsonLength;
  view.setUint32(binaryHeader, binaryLength, true);
  view.setUint32(binaryHeader + 4, 0x004e4942, true);
  output.set(binary, binaryHeader + 8);
  return output;
}
