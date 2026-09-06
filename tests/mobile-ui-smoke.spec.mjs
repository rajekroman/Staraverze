import { test, expect } from "@playwright/test";

async function inputSnapshot(page) {
  return page.evaluate(async () => {
    const { app } = await import("./src/bootstrap.js");
    return app.input.snapshot();
  });
}

async function openChlumWithKeyboard(page) {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.goto("/?debug=1", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#titleScreen")).toHaveClass(/visible/);
  await page.locator("#playButton").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#briefScreen")).toHaveClass(/visible/);
  await page.locator("#briefButton").tap();
  await expect(page.locator("#app")).toHaveClass(/playing/);
  await expect(page.locator("#controls")).not.toHaveClass(/hidden/);
  return pageErrors;
}

async function assertSafeBounds(page) {
  const layout = await page.evaluate(() => {
    const selectors = {
      mission: ".mission-panel",
      danger: "#heatPill",
      pause: "#pauseButton",
      move: "#moveZone",
      action: "#actionButton"
    };
    const rects = Object.fromEntries(Object.entries(selectors).map(([name, selector]) => {
      const element = document.querySelector(selector);
      const rect = element?.getBoundingClientRect();
      return [name, rect ? { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height } : null];
    }));
    const root = document.documentElement;
    const inlineStyle = root.style;
    const computedStyle = getComputedStyle(root);
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      rects,
      safeSource: ["--safe-t", "--safe-r", "--safe-b", "--safe-l"].map(name => inlineStyle.getPropertyValue(name).trim()),
      safeResolved: ["--safe-t", "--safe-r", "--safe-b", "--safe-l"].map(name => computedStyle.getPropertyValue(name).trim()),
      visualWidth: computedStyle.getPropertyValue("--visual-viewport-width").trim(),
      visualHeight: computedStyle.getPropertyValue("--visual-viewport-height").trim()
    };
  });

  for (const [name, rect] of Object.entries(layout.rects)) {
    expect(rect, `${name} element must exist`).not.toBeNull();
    expect(rect.left, `${name} left`).toBeGreaterThanOrEqual(-1);
    expect(rect.top, `${name} top`).toBeGreaterThanOrEqual(-1);
    expect(rect.right, `${name} right`).toBeLessThanOrEqual(layout.width + 1);
    expect(rect.bottom, `${name} bottom`).toBeLessThanOrEqual(layout.height + 1);
    expect(rect.width, `${name} width`).toBeGreaterThan(0);
    expect(rect.height, `${name} height`).toBeGreaterThan(0);
  }

  for (const source of layout.safeSource) expect(source).toContain("env(safe-area-inset");
  for (const resolved of layout.safeResolved) expect(resolved).not.toBe("");
  expect(layout.visualWidth).toMatch(/px$/);
  expect(layout.visualHeight).toMatch(/px$/);
}

async function dispatchMove(page, pointerId, xFactor = 0.85) {
  const box = await page.locator("#moveZone").boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;
  await page.evaluate(({ pointerId, centerX, centerY, targetX }) => {
    const zone = document.getElementById("moveZone");
    zone.dispatchEvent(new PointerEvent("pointerdown", {
      pointerId,
      isPrimary: true,
      button: 0,
      clientX: centerX,
      clientY: centerY,
      bubbles: true,
      cancelable: true
    }));
    zone.dispatchEvent(new PointerEvent("pointermove", {
      pointerId,
      isPrimary: true,
      button: 0,
      clientX: targetX,
      clientY: centerY,
      bubbles: true,
      cancelable: true
    }));
  }, {
    pointerId,
    centerX: box.x + box.width * 0.5,
    centerY: box.y + box.height * 0.5,
    targetX: box.x + box.width * xFactor
  });
}

test("HUD safe-area and input bindings survive pointer loss and orientation changes", async ({ page }) => {
  test.setTimeout(45_000);
  const pageErrors = await openChlumWithKeyboard(page);

  await assertSafeBounds(page);

  await dispatchMove(page, 41);
  await expect.poll(async () => {
    const move = (await inputSnapshot(page)).axes.move;
    return typeof move === "object" ? move.length : 0;
  }).toBeGreaterThan(0);

  await page.evaluate(() => window.dispatchEvent(new PointerEvent("pointerup", { pointerId: 42, bubbles: true })));
  expect((await inputSnapshot(page)).axes.move.length).toBeGreaterThan(0);
  await page.evaluate(() => window.dispatchEvent(new PointerEvent("pointercancel", { pointerId: 41, bubbles: true })));
  await expect.poll(async () => (await inputSnapshot(page)).axes.move?.length ?? 0).toBe(0);
  await expect(page.locator("#stick")).toHaveCSS("transform", /matrix\(1, 0, 0, 1, -29, -29\)|none/);

  await page.evaluate(() => {
    const action = document.getElementById("actionButton");
    action.dispatchEvent(new PointerEvent("pointerdown", {
      pointerId: 61,
      isPrimary: true,
      button: 0,
      bubbles: true,
      cancelable: true
    }));
  });
  await expect.poll(async () => Boolean((await inputSnapshot(page)).actions.action?.down)).toBe(true);
  await expect(page.locator("#actionButton")).toHaveClass(/active/);
  await page.evaluate(() => window.dispatchEvent(new PointerEvent("pointerup", { pointerId: 62, bubbles: true })));
  expect(Boolean((await inputSnapshot(page)).actions.action?.down)).toBe(true);
  await page.evaluate(() => window.dispatchEvent(new PointerEvent("pointerup", { pointerId: 61, bubbles: true })));
  await expect.poll(async () => Boolean((await inputSnapshot(page)).actions.action?.down)).toBe(false);
  await expect(page.locator("#actionButton")).not.toHaveClass(/active/);

  await dispatchMove(page, 71);
  await page.setViewportSize({ width: 844, height: 390 });
  await page.evaluate(() => window.dispatchEvent(new Event("orientationchange")));
  await expect.poll(async () => (await inputSnapshot(page)).axes.move?.length ?? 0).toBe(0);
  await expect.poll(() => page.evaluate(() => window.__lovecRuntime.snapshot().renderer.width)).toBe(844);
  await assertSafeBounds(page);

  expect(pageErrors).toEqual([]);
});
