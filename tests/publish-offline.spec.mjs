import { test, expect } from "@playwright/test";

const APP_PATH = "/Staraverze/";
const SAVE_KEY = "lovecVltavinuRebornSaveV5_4_2";
const OLD_APP_CACHE = "lovec-vltavinu-reborn-v5-4-2-publish-upgrade-test-old";
const OTHER_APP_CACHE = "another-app-cache";

test("dist PWA přejde ze staré cache na novou bez ztráty postupu", async ({ page, context, request }) => {
  await page.addInitScript(({ oldCache, otherCache }) => {
    const register = navigator.serviceWorker.register.bind(navigator.serviceWorker);
    navigator.serviceWorker.register = async (...args) => {
      await caches.open(otherCache);
      await caches.open(oldCache);
      return register(...args);
    };
  }, { oldCache: OLD_APP_CACHE, otherCache: OTHER_APP_CACHE });

  await page.goto(`${APP_PATH}?debug=1`, { waitUntil: "load" });

  await expect.poll(
    () => page.evaluate(async () => {
      if (!("serviceWorker" in navigator)) return false;
      await navigator.serviceWorker.ready;
      return Boolean(navigator.serviceWorker.controller);
    }),
    { timeout: 15_000 }
  ).toBe(true);

  const registration = await page.evaluate(async appPath => {
    const found = await navigator.serviceWorker.getRegistration(appPath);
    const ready = found || await navigator.serviceWorker.ready;
    return { scope: ready.scope, scriptURL: ready.active?.scriptURL || "" };
  }, APP_PATH);
  expect(new URL(registration.scope).pathname).toBe(APP_PATH);
  expect(new URL(registration.scriptURL).pathname).toBe(`${APP_PATH}sw.js`);

  const swText = await (await request.get(`${APP_PATH}sw.js`)).text();
  const currentCache = swText.match(/const CACHE = "([^"]+)"/)?.[1];
  expect(currentCache).toBeTruthy();

  await expect.poll(
    () => page.evaluate(async cacheName => (await caches.keys()).includes(cacheName), currentCache),
    { timeout: 15_000 }
  ).toBe(true);
  await expect.poll(
    () => page.evaluate(async oldCache => (await caches.keys()).includes(oldCache), OLD_APP_CACHE),
    { timeout: 15_000 }
  ).toBe(false);
  expect(await page.evaluate(async otherCache => (await caches.keys()).includes(otherCache), OTHER_APP_CACHE)).toBe(true);

  await page.locator("#playButton").click();
  await expect(page.locator("#briefScreen")).toHaveClass(/visible/);
  await page.locator("#briefButton").click();
  await expect.poll(() => page.evaluate(() => window.__lovecDebug?.snapshot().mode)).toBe("playing");

  const savedBeforeUpgrade = await page.evaluate(saveKey => localStorage.getItem(saveKey), SAVE_KEY);
  expect(savedBeforeUpgrade).toBeTruthy();

  const unknown = await page.evaluate(async () => (await fetch("./not-a-game-asset-audit.txt")).status);
  expect(unknown).toBe(404);
  expect(
    await page.evaluate(async ({ cacheName, path }) => Boolean(await (await caches.open(cacheName)).match(path)), {
      cacheName: currentCache,
      path: "./not-a-game-asset-audit.txt"
    })
  ).toBe(false);

  await context.setOffline(true);
  const response = await page.reload({ waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  expect(await page.evaluate(saveKey => localStorage.getItem(saveKey), SAVE_KEY)).toBe(savedBeforeUpgrade);
  expect(await page.evaluate(async otherCache => (await caches.keys()).includes(otherCache), OTHER_APP_CACHE)).toBe(true);

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
      return { ok: response.ok, status: response.status, length: (await response.arrayBuffer()).byteLength };
    }, asset);
    expect(cached.ok, asset).toBe(true);
    expect(cached.status, asset).toBe(200);
    expect(cached.length, asset).toBeGreaterThan(50);
  }
});
