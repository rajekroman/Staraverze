import { test, expect } from "@playwright/test";

test("excavator work start turret turn bucket cycle and stop evidence", async ({ page }) => {
  await page.goto("/?debug=1", { waitUntil: "domcontentloaded" });
  await expect.poll(() => page.evaluate(() => Boolean(window.__lovecDebug))).toBe(true);

  await page.evaluate(() => {
    window.__lovecDebug.startLevel(3);
    window.__lovecDebug.setPlayer(900, 720);
    window.__lovecDebug.setExcavatorState(0,{
      x:900,y:600,angle:0,turretAngle:-.42,turretTarget:-.42,
      workPhase:.7,workSpeed:0,working:false,variant:0
    });
    window.__lovecDebug.snapCameraToPlayer();
    document.getElementById("hud")?.classList.add("hidden");
    document.getElementById("controls")?.classList.add("hidden");
  });

  const initial=await page.evaluate(() => window.__lovecDebug.excavatorSnapshot()[0]);
  await page.waitForTimeout(900);
  const parked=await page.evaluate(() => window.__lovecDebug.excavatorSnapshot()[0]);
  expect(Math.abs(parked.workPhase-initial.workPhase)).toBeLessThan(.002);
  expect(Math.abs(parked.turretAngle-initial.turretAngle)).toBeLessThan(.002);
  expect(parked.x).toBe(initial.x);expect(parked.y).toBe(initial.y);

  await page.evaluate(() => window.__lovecDebug.setExcavatorState(0,{working:true,turretTarget:.62}));
  await page.waitForTimeout(2700);
  const working=await page.evaluate(() => window.__lovecDebug.excavatorSnapshot()[0]);
  expect(working.workPhase).toBeGreaterThan(initial.workPhase+1.5);
  expect(working.turretAngle).toBeGreaterThan(.3);
  expect(working.x).toBe(initial.x);expect(working.y).toBe(initial.y);

  await page.evaluate(() => window.__lovecDebug.setExcavatorState(0,{turretTarget:-.28}));
  await page.waitForTimeout(1600);
  const turned=await page.evaluate(() => window.__lovecDebug.excavatorSnapshot()[0]);
  expect(turned.turretAngle).toBeLessThan(working.turretAngle-.35);

  await page.evaluate(() => {
    const current=window.__lovecDebug.excavatorSnapshot()[0];
    window.__lovecDebug.setExcavatorState(0,{working:false,turretTarget:current.turretAngle});
  });
  await page.waitForTimeout(850);
  const stopA=await page.evaluate(() => window.__lovecDebug.excavatorSnapshot()[0]);
  await page.waitForTimeout(850);
  const stopB=await page.evaluate(() => window.__lovecDebug.excavatorSnapshot()[0]);
  expect(stopB.workSpeed).toBe(0);
  expect(Math.abs(stopB.workPhase-stopA.workPhase)).toBeLessThan(.002);
  expect(Math.abs(stopB.turretAngle-stopA.turretAngle)).toBeLessThan(.002);
  expect(stopB.x).toBe(initial.x);expect(stopB.y).toBe(initial.y);
});
