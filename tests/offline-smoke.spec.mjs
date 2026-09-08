import { test, expect } from "@playwright/test";

const CACHE_NAME = "lovec-vltavinu-reborn-v5-4-2-runtime-5";

test("PWA se po prvním načtení spustí i bez sítě", async ({ page, context }) => {
  await page.addInitScript(() => {
    const register = navigator.serviceWorker.register.bind(navigator.serviceWorker);
    navigator.serviceWorker.register = async (...args) => {
      await caches.open("another-app-cache");
      await caches.open("lovec-vltavinu-reborn-v5-4-2-old");
      return register(...args);
    };
  });
  await page.goto("/?debug=1", { waitUntil: "load" });

  await expect.poll(
    () => page.evaluate(async () => {
      if (!("serviceWorker" in navigator)) return false;
      await navigator.serviceWorker.ready;
      return Boolean(navigator.serviceWorker.controller);
    }),
    { timeout: 15_000 }
  ).toBe(true);

  await expect.poll(
    () => page.evaluate(async cacheName => (await caches.keys()).includes(cacheName), CACHE_NAME),
    { timeout: 15_000 }
  ).toBe(true);

  await expect.poll(
    () => page.evaluate(async () => (await caches.keys()).filter(name => name.startsWith("lovec-vltavinu-reborn-v5-4-2"))),
    { timeout: 15_000 }
  ).toHaveLength(1);

  const unknown = await page.evaluate(async () => {
    const response = await fetch("./not-a-game-asset-audit.txt");
    return response.status;
  });
  expect(unknown).toBe(404);
  expect(await page.evaluate(async cacheName => Boolean(await (await caches.open(cacheName)).match("./not-a-game-asset-audit.txt")), CACHE_NAME)).toBe(false);
  await context.setOffline(true);
  expect(await page.evaluate(() => caches.has("another-app-cache"))).toBe(true);

  const response = await page.reload({ waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);

  for (const asset of [
    "./game.js",
    "./style.css",
    "./manifest.webmanifest",
    "./assets/audio/ambient/ambient-chlum.mp3",
    "./assets/audio/effects/dig-perfect.mp3",
    "./assets/ui/nzv-logo-purple.png"
  ]) {
    const cached = await page.evaluate(async path => {
      const response = await fetch(path);
      return { ok: response.ok, status: response.status, length: (await response.text()).length };
    }, asset);
    expect(cached.ok, asset).toBe(true);
    expect(cached.status, asset).toBe(200);
    expect(cached.length, asset).toBeGreaterThan(50);
  }

  await expect(page.locator("#playButton")).toBeVisible();
  await expect.poll(() => page.evaluate(() => Boolean(window.__lovecDebug))).toBe(true);

  const started = await page.evaluate(() => window.__lovecDebug.startLevel(0));
  expect(started.level).toBe("chlum");

  const snapshot = await page.evaluate(() => window.__lovecDebug.snapshot());
  expect(snapshot).toMatchObject({
    version: "5.4.2",
    mode: "playing",
    level: "chlum"
  });

  const canvas = await page.locator("#game").evaluate(element => ({
    width: element.width,
    height: element.height
  }));
  expect(canvas.width).toBeGreaterThan(300);
  expect(canvas.height).toBeGreaterThan(300);
});
