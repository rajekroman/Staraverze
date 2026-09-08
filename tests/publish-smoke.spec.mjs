import { test, expect } from "@playwright/test";
import { DISTRIBUTION_NOTICE_FILES, PUBLISH_FILES } from "../tools/publish-files.mjs";

const APP_PATH = "/Staraverze/";
const LEVELS = ["chlum", "locenice", "nesmen", "besednice", "malse"];
const INTERNAL_PATHS = [
  "AGENTS.md",
  "PRODUCTION_AUDIT.md",
  "BUILD_REPORT.txt",
  "AUDIO_RELEASE_CHECKLIST.md",
  "docs/VISUAL_REFERENCE_RULES.md",
  "tests/game-smoke.spec.mjs",
  "tools/validate.mjs",
  "package.json",
  "assets/audio/v73-audio-build-audit.json"
];

test("dist funguje jako Pages balíček pod /Staraverze/", async ({ page, request }) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("response", response => {
    const url = new URL(response.url());
    if (url.pathname.startsWith(APP_PATH) && response.status() >= 400) errors.push(`${response.status()} ${url.pathname}`);
  });

  const navigation = await page.goto(`${APP_PATH}?debug=1`, { waitUntil: "load" });
  expect(navigation?.status()).toBe(200);
  expect(new URL(page.url()).pathname).toBe(APP_PATH);
  await expect(page.locator("#playButton")).toBeVisible();
  await expect.poll(() => page.evaluate(() => Boolean(window.__lovecDebug))).toBe(true);

  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", "./manifest.webmanifest");
  const manifestResponse = await request.get(`${APP_PATH}manifest.webmanifest`);
  expect(manifestResponse.status()).toBe(200);
  const manifest = await manifestResponse.json();
  expect(manifest.start_url).toBe("./");
  expect(manifest.scope).toBe("./");
  for (const icon of manifest.icons || []) {
    const iconResponse = await request.get(`${APP_PATH}${icon.src.replace(/^\.\//, "")}`);
    expect(iconResponse.status(), icon.src).toBe(200);
  }

  for (const file of PUBLISH_FILES) {
    const response = await request.get(`${APP_PATH}${file}`);
    expect(response.status(), file).toBe(200);
  }
  for (const notice of DISTRIBUTION_NOTICE_FILES) {
    const response = await request.get(`${APP_PATH}${notice}`);
    expect(await response.text(), notice).toContain("provenance");
  }

  for (let index = 0; index < LEVELS.length; index += 1) {
    const snapshot = await page.evaluate(levelIndex => {
      window.__lovecDebug.startLevel(levelIndex);
      return window.__lovecDebug.snapshot();
    }, index);
    expect(snapshot.level, `level ${index}`).toBe(LEVELS[index]);
    expect(snapshot.mode, LEVELS[index]).toBe("playing");
    expect(snapshot.world, LEVELS[index]).toBeTruthy();
  }

  for (const internal of INTERNAL_PATHS) {
    const response = await request.get(`${APP_PATH}${internal}`);
    expect(response.status(), internal).toBe(404);
  }

  expect(errors).toEqual([]);
});
