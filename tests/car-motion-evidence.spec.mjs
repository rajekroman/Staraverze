import { test, expect } from "@playwright/test";

test("car start stop turn and wheel evidence", async ({ page }) => {
  await page.goto("/?debug=1", { waitUntil: "domcontentloaded" });
  await expect.poll(() => page.evaluate(() => Boolean(window.__lovecDebug))).toBe(true);

  await page.evaluate(() => {
    window.__lovecDebug.startLevel(4);
    window.__lovecDebug.setPlayer(1050, 760);
    window.__lovecDebug.setPatrolMotion("car", {
      x:820,y:700,speed:0,angle:0,resetMotion:true,collisionEnabled:false,
      points:[{x:820,y:700},{x:1160,y:700},{x:1160,y:390}],index:1
    });
    window.__lovecDebug.snapCameraToPlayer();
    document.getElementById("hud")?.classList.add("hidden");
    document.getElementById("controls")?.classList.add("hidden");
  });

  const initial = await page.evaluate(() => window.__lovecDebug.patrolSnapshot().find(p => p.type === "car"));
  await page.waitForTimeout(700);
  const stopped = await page.evaluate(() => window.__lovecDebug.patrolSnapshot().find(p => p.type === "car"));
  expect(stopped.moving).toBe(false);
  expect(Math.abs(stopped.wheelRotation - initial.wheelRotation)).toBeLessThan(.001);
  expect(Math.abs(stopped.distanceTravelled - initial.distanceTravelled)).toBeLessThan(.001);

  await page.evaluate(() => window.__lovecDebug.setPatrolMotion("car", { speed:190 }));
  await page.waitForTimeout(2200);
  const driving = await page.evaluate(() => window.__lovecDebug.patrolSnapshot().find(p => p.type === "car"));
  expect(driving.moving).toBe(true);
  expect(driving.distanceTravelled).toBeGreaterThan(300);
  expect(Math.abs(driving.wheelRotation)).toBeGreaterThan(2);

  await page.waitForTimeout(1300);
  const turned = await page.evaluate(() => window.__lovecDebug.patrolSnapshot().find(p => p.type === "car"));
  expect(turned.distanceTravelled).toBeGreaterThan(driving.distanceTravelled);
  expect(Math.abs(turned.visualAngle)).toBeGreaterThan(.45);

  await page.evaluate(() => window.__lovecDebug.setPatrolMotion("car", { speed:0 }));
  await page.waitForTimeout(400);
  const stopA = await page.evaluate(() => window.__lovecDebug.patrolSnapshot().find(p => p.type === "car"));
  await page.waitForTimeout(700);
  const stopB = await page.evaluate(() => window.__lovecDebug.patrolSnapshot().find(p => p.type === "car"));
  expect(stopB.moving).toBe(false);
  expect(Math.abs(stopB.wheelRotation - stopA.wheelRotation)).toBeLessThan(.001);
  expect(Math.abs(stopB.distanceTravelled - stopA.distanceTravelled)).toBeLessThan(.001);
});
