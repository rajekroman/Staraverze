import { test, expect } from "@playwright/test";

async function openDebug(page) {
  await page.goto("/?debug=1", { waitUntil: "domcontentloaded" });
  await expect.poll(() => page.evaluate(() => Boolean(window.__lovecDebug))).toBe(true);
}

async function visualStats(page) {
  return page.locator("#game").evaluate(canvas => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const image = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
    let nonDark = 0;
    for (let i = 0; i < image.length; i += 4 * 19) {
      if (image[i] + image[i + 1] + image[i + 2] > 36) nonDark++;
    }
    return { width: canvas.width, height: canvas.height, cssWidth: rect.width, cssHeight: rect.height, nonDark };
  });
}

test("vizuální regresní brána: každý level má stabilní kreslený terén", async ({ page }) => {
  await openDebug(page);
  for (const level of [0, 1, 2, 3, 4]) {
    await page.evaluate(index => window.__lovecDebug.startLevel(index), level);
    await page.waitForTimeout(90);
    const stats = await visualStats(page);
    expect(stats.width).toBeGreaterThan(300);
    expect(stats.height).toBeGreaterThan(300);
    expect(stats.nonDark).toBeGreaterThan(100);
  }
});

test.describe("kopání se vejde do mobilního viewportu", () => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
    test(`${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await openDebug(page);
      await page.evaluate(() => window.__lovecDebug.startDigChallenge(2));
      const bounds = await page.locator("#digScreen .dig-card").evaluate(card => {
        const r = card.getBoundingClientRect();
        return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
      });
      expect(bounds.left).toBeGreaterThanOrEqual(0);
      expect(bounds.top).toBeGreaterThanOrEqual(0);
      expect(bounds.right).toBeLessThanOrEqual(viewport.width);
      expect(bounds.bottom).toBeLessThanOrEqual(viewport.height);
      await expect(page.locator("#digButton")).toBeVisible();
    });
  }
});
