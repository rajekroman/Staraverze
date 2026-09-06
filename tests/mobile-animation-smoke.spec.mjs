import { test, expect } from "@playwright/test";

async function playerVisual(page) {
  return page.evaluate(async () => {
    const { renderer, nesmen } = await import("/src/bootstrap.js");
    const entity = nesmen.playerEntity;
    const object = renderer.objectByEntity.get(entity);
    const sprite = nesmen.app.world.get(entity, "sprite");
    const animation = nesmen.app.world.get(entity, "animation");
    return {
      frame: sprite?.frame ?? null,
      flipX: sprite?.flipX ?? null,
      playing: animation?.playing ?? null,
      offsetX: object?.material?.map?.offset?.x ?? null,
      offsetY: object?.material?.map?.offset?.y ?? null,
      scaleX: object?.scale?.x ?? null
    };
  });
}

test("Nesměň player walk cycle updates real sprite UVs and facing", async ({ page }) => {
  test.setTimeout(30_000);
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));

  await page.goto("/?debug=1", { waitUntil: "domcontentloaded" });
  await expect.poll(() => page.evaluate(() => Boolean(window.__lovecRuntime))).toBe(true);
  await page.evaluate(async () => {
    const { app, session } = await import("/src/bootstrap.js");
    session.reset();
    await app.changeScene("nesmen");
  });
  await expect(page.locator("#briefScreen")).toHaveClass(/visible/);
  await page.locator("#briefButton").tap();
  await expect(page.locator("#app")).toHaveClass(/playing/);

  const idle = await playerVisual(page);
  expect(idle.frame).toBe(0);
  expect(idle.offsetX).toBeCloseTo(0, 6);
  expect(idle.offsetY).toBeCloseTo(0.75, 6);
  expect(idle.scaleX).toBeGreaterThan(0);

  await page.keyboard.down("ArrowRight");
  try {
    await expect.poll(async () => {
      const visual = await playerVisual(page);
      return visual.playing
        && [8, 9, 10, 11].includes(visual.frame)
        && Math.abs(visual.offsetX - (visual.frame % 4) / 4) < 0.001
        && Math.abs(visual.offsetY - 0.25) < 0.001;
    }, { timeout: 3_000, intervals: [30, 50, 80] }).toBe(true);
  } finally {
    await page.keyboard.up("ArrowRight");
  }

  await expect.poll(() => playerVisual(page), { timeout: 3_000, intervals: [30, 50, 80] }).toMatchObject({
    frame: 8,
    playing: false
  });
  await expect.poll(async () => (await playerVisual(page)).offsetX, { timeout: 3_000, intervals: [30, 50, 80] }).toBeCloseTo(idle.offsetX, 6);
  await expect.poll(async () => (await playerVisual(page)).offsetY, { timeout: 3_000, intervals: [30, 50, 80] }).toBeCloseTo(0.25, 6);

  await page.keyboard.down("ArrowLeft");
  try {
    await expect.poll(async () => (await playerVisual(page)).offsetY, { timeout: 3_000, intervals: [30, 50, 80] }).toBeCloseTo(0.5, 6);
    await expect.poll(async () => (await playerVisual(page)).scaleX, { timeout: 3_000, intervals: [30, 50, 80] }).toBeGreaterThan(0);
  } finally {
    await page.keyboard.up("ArrowLeft");
  }

  await page.keyboard.down("ArrowRight");
  try {
    await expect.poll(async () => (await playerVisual(page)).offsetY, { timeout: 3_000, intervals: [30, 50, 80] }).toBeCloseTo(0.25, 6);
    await expect.poll(async () => (await playerVisual(page)).scaleX, { timeout: 3_000, intervals: [30, 50, 80] }).toBeGreaterThan(0);
  } finally {
    await page.keyboard.up("ArrowRight");
  }

  expect(pageErrors).toEqual([]);
});
