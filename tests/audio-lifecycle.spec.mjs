import { test, expect } from "@playwright/test";

async function audioSnapshot(page) {
  return page.evaluate(() => window.__lovecRuntime.snapshot().audio);
}

async function activateButton(page, locator) {
  await locator.focus();
  await page.keyboard.press("Enter");
}

async function setDocumentHidden(page, hidden) {
  await page.evaluate(value => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => value
    });
    document.dispatchEvent(new Event("visibilitychange"));
  }, hidden);
}

test("audio lifecycle remains gesture-gated and disposes cleanly", async ({ page }) => {
  test.setTimeout(90_000);
  const pageErrors = [];
  const httpErrors = [];

  page.on("pageerror", error => pageErrors.push(error.message));
  page.on("response", response => {
    if (response.status() >= 400) httpErrors.push(`${response.status()} ${response.url()}`);
  });

  await page.goto("/index.html?debug=audio-lifecycle", { waitUntil: "domcontentloaded" });
  await expect.poll(async () => Boolean(await page.evaluate(() => window.__lovecRuntime))).toBe(true);

  const soundButton = page.locator("#soundButton");
  await expect(soundButton).toBeAttached();
  await expect(soundButton).toBeHidden();

  await expect.poll(() => audioSnapshot(page)).toMatchObject({
    state: "locked",
    muted: false,
    contextState: "none",
    activeSources: 0
  });

  const playButton = page.locator("#playButton");
  await expect(playButton).toBeVisible();
  await activateButton(page, playButton);
  await expect.poll(() => audioSnapshot(page)).toMatchObject({
    state: "ready",
    muted: false,
    contextState: "running"
  });

  const briefButton = page.locator("#briefButton");
  await expect(briefButton).toBeVisible();
  await activateButton(page, briefButton);
  await expect(soundButton).toBeVisible();

  await activateButton(page, soundButton);
  await expect.poll(() => audioSnapshot(page)).toMatchObject({
    state: "muted",
    muted: true,
    contextState: "running"
  });

  await activateButton(page, soundButton);
  await expect.poll(() => audioSnapshot(page)).toMatchObject({
    state: "ready",
    muted: false,
    contextState: "running"
  });

  await setDocumentHidden(page, true);
  await expect.poll(() => audioSnapshot(page)).toMatchObject({
    state: "suspended",
    contextState: "suspended"
  });

  await setDocumentHidden(page, false);
  await activateButton(page, soundButton);
  await expect.poll(() => audioSnapshot(page)).toMatchObject({
    state: "ready",
    muted: false,
    contextState: "running"
  });

  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pagehide")));
  await expect.poll(() => audioSnapshot(page)).toMatchObject({
    state: "suspended",
    contextState: "suspended"
  });

  await page.evaluate(async () => {
    const { audio } = await import("./src/bootstrap.js");
    await audio.dispose();
  });
  await expect.poll(() => audioSnapshot(page)).toMatchObject({
    state: "disposed",
    contextState: "none",
    activeSources: 0,
    loaded: 0
  });

  expect(pageErrors).toEqual([]);
  expect(httpErrors).toEqual([]);
});
