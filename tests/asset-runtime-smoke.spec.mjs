import { test, expect } from "@playwright/test";

async function openChlum(page) {
  await page.goto("/?debug=1", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#titleScreen")).toHaveClass(/visible/);
  await page.locator("#playButton").dispatchEvent("click");
  await expect(page.locator("#briefScreen")).toHaveClass(/visible/);
  await page.locator("#briefButton").dispatchEvent("click");
  await expect(page.locator("#app")).toHaveClass(/playing/, { timeout: 20_000 });
}

test("standardní GLTFLoader r185 načte texturovaný GLB a instance mají oddělené dispose vlastnictví", async ({ page }) => {
  test.setTimeout(45_000);
  const failedResponses = [];
  const pageErrors = [];
  page.on("response", response => {
    if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
  });
  page.on("pageerror", error => pageErrors.push(error.message));

  await openChlum(page);

  const result = await page.evaluate(async () => {
    const [{ app }, { GltfAssetLoader, GLTF_LOADER_REVISION }, { ModelFactory }, { disposeObject3D }, { createTexturedGlb }] = await Promise.all([
      import("./src/bootstrap.js"),
      import("./src/render/GltfAssetLoader.js"),
      import("./src/render/ModelFactory.js"),
      import("./src/render/AssetDisposal.js"),
      import("./tests/fixtures/textured-glb.mjs")
    ]);

    const bytes = createTexturedGlb();
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    const url = `data:model/gltf-binary;base64,${btoa(binary)}`;
    const loader = new GltfAssetLoader();
    const source = await loader.load({ id: "standard-textured-fixture", type: "gltf", url });
    let sourceMesh = null;
    source.traverse(node => { if (!sourceMesh && node.isMesh) sourceMesh = node; });

    const renderer = { bindEntity() {}, disposeObject: disposeObject3D };
    const factory = new ModelFactory({ renderer });
    const first = factory.clone(source);
    const second = factory.clone(source);
    let firstMesh = null;
    let secondMesh = null;
    first.traverse(node => { if (!firstMesh && node.isMesh) firstMesh = node; });
    second.traverse(node => { if (!secondMesh && node.isMesh) secondMesh = node; });

    const before = {
      sourceTexture: sourceMesh?.material?.map?.uuid,
      firstTexture: firstMesh?.material?.map?.uuid,
      secondTexture: secondMesh?.material?.map?.uuid,
      sourceGeometry: sourceMesh?.geometry?.uuid,
      firstGeometry: firstMesh?.geometry?.uuid,
      secondGeometry: secondMesh?.geometry?.uuid
    };
    factory.dispose(first);
    const level = app.scenes.activeScene?.level;

    return {
      revision: GLTF_LOADER_REVISION,
      sourceRevision: source.userData.gltfLoaderRevision,
      hasMesh: Boolean(sourceMesh?.isMesh),
      hasTexture: Boolean(sourceMesh?.material?.map?.isTexture),
      isolatedTextures: new Set([before.sourceTexture, before.firstTexture, before.secondTexture]).size === 3,
      isolatedGeometry: new Set([before.sourceGeometry, before.firstGeometry, before.secondGeometry]).size === 3,
      secondTextureAlive: Boolean(secondMesh?.material?.map?.isTexture),
      sourceTextureAlive: Boolean(sourceMesh?.material?.map?.isTexture),
      spritesheetType: app.assets.cachedEntry("player-hunter-walk")?.type ?? null,
      selectedIds: app.assets.selectPreload(level?.assetGroups ?? []).map(entry => entry.id)
    };
  });

  expect(result.revision).toBe("185");
  expect(result.sourceRevision).toBe("185");
  expect(result.hasMesh).toBe(true);
  expect(result.hasTexture).toBe(true);
  expect(result.isolatedTextures).toBe(true);
  expect(result.isolatedGeometry).toBe(true);
  expect(result.secondTextureAlive).toBe(true);
  expect(result.sourceTextureAlive).toBe(true);
  expect(result.spritesheetType).toBe("spritesheet");
  expect(result.selectedIds).toContain("player-hunter-walk");
  expect(result.selectedIds).toContain("model-chlum-tractor-no-driver");
  expect(failedResponses).toEqual([]);
  expect(pageErrors).toEqual([]);
});
