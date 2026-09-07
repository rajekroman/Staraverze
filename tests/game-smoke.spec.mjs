import { test, expect } from "@playwright/test";

const LEVELS = ["chlum", "locenice", "nesmen", "besednice", "malse"];
const SAVE_KEY = "lovecVltavinuRebornSaveV5_4_2";
const LEGACY_SAVE_KEY = "lovecVltavinuRebornSaveV5_2";

function watchErrors(page) {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("response", response => {
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });
  return errors;
}

async function openDebug(page) {
  await page.goto("/?debug=1", { waitUntil: "domcontentloaded" });
  await expect.poll(() => page.evaluate(() => Boolean(window.__lovecDebug))).toBe(true);
}

test("hlavní nabídka je celá dosažitelná v aktuálním viewportu", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const layout = await page.evaluate(() => ({
    width: innerWidth,
    height: innerHeight,
    controls: ["playButton", "howButton", "recordsButton"].map(id => {
      const rect = document.getElementById(id).getBoundingClientRect();
      return { id, left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
    })
  }));
  for (const control of layout.controls) {
    expect(control.left, `${control.id} left`).toBeGreaterThanOrEqual(0);
    expect(control.top, `${control.id} top`).toBeGreaterThanOrEqual(0);
    expect(control.right, `${control.id} right`).toBeLessThanOrEqual(layout.width);
    expect(control.bottom, `${control.id} bottom`).toBeLessThanOrEqual(layout.height);
  }
  expect(errors).toEqual([]);
});

test("všech pět levelů se spustí a vykreslí bez runtime chyby", async ({ page }) => {
  const errors = watchErrors(page);
  await openDebug(page);
  for (let index = 0; index < LEVELS.length; index += 1) {
    const started = await page.evaluate(level => window.__lovecDebug.startLevel(level), index);
    expect(started.level).toBe(LEVELS[index]);
    await page.waitForTimeout(250);
    const snapshot = await page.evaluate(() => window.__lovecDebug.snapshot());
    expect(snapshot).toMatchObject({ version: "5.4.2", mode: "playing", level: LEVELS[index] });
    const canvas = await page.locator("#game").evaluate(element => ({ width: element.width, height: element.height }));
    expect(canvas.width).toBeGreaterThan(300);
    expect(canvas.height).toBeGreaterThan(300);
  }
  expect(errors).toEqual([]);
});

test("noční Besednice nemá černou vymazanou plochu", async ({ page }) => {
  const errors = watchErrors(page);
  await openDebug(page);
  await page.evaluate(() => window.__lovecDebug.startLevel(3));
  await page.waitForTimeout(350);
  const sample = await page.locator("#game").evaluate(canvas => {
    const context = canvas.getContext("2d");
    const scaleX = canvas.width / canvas.getBoundingClientRect().width;
    const scaleY = canvas.height / canvas.getBoundingClientRect().height;
    const pixel = context.getImageData(Math.round(45 * scaleX), Math.round(canvas.height / 2), 1, 1).data;
    return [...pixel];
  });
  expect(sample.slice(0, 3).some(channel => channel > 5)).toBe(true);
  expect(errors).toEqual([]);
});

test("pauza a ztráta fokusu vždy uvolní pohyb", async ({ page }) => {
  const errors = watchErrors(page);
  await openDebug(page);
  await page.evaluate(() => window.__lovecDebug.startLevel(0));

  await page.keyboard.down("KeyD");
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.snapshot().input.x)).toBe(1);
  await page.locator("#pauseButton").click();
  await expect(page.locator("#pauseScreen")).toHaveClass(/visible/);
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.snapshot().input)).toEqual({ x: 0, y: 0, pressed: false });

  await page.locator("#resumeButton").click();
  await page.keyboard.down("KeyW");
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.snapshot().input.y)).toBe(-1);
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.snapshot().input)).toEqual({ x: 0, y: 0, pressed: false });
  expect(errors).toEqual([]);
});

test("starý nebo poškozený save se bezpečně obnoví", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto("/");
  await page.evaluate(({ legacyKey }) => {
    localStorage.clear();
    localStorage.setItem(legacyKey, JSON.stringify({
      version: "5.1.0",
      levelIndex: 999,
      score: "420",
      stones: [null, { id: "old", name: "Starý nález", locality: "Chlum", weight: "2.5", quality: 150, value: "900" }],
      perks: { boots: 99 },
      stats: { digs: "3" },
      sound: false
    }));
  }, { legacyKey: LEGACY_SAVE_KEY });
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator("#continueButton")).toBeVisible();
  await page.locator("#continueButton").click();
  await expect(page.locator("#briefKicker")).toHaveText("LOKALITA 5 / 5");
  await page.locator("#briefButton").click();
  const restored = await page.evaluate(({ saveKey }) => ({
    snapshot: window.__lovecDebug?.snapshot?.(),
    save: JSON.parse(localStorage.getItem(saveKey))
  }), { saveKey: SAVE_KEY });
  expect(restored.save).toMatchObject({ version: "5.4.2", levelIndex: 4, score: 420, sound: false });
  expect(restored.save.stones).toHaveLength(1);
  expect(restored.save.stones[0]).toMatchObject({ weight: 2.5, quality: 100, value: 900 });
  expect(restored.save.perks.boots).toBe(3);
  expect(errors).toEqual([]);
});
