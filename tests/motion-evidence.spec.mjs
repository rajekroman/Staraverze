import { test, expect } from "@playwright/test";

test("tractor start stop turn and field-work evidence", async ({ page }) => {
  await page.goto("/?debug=1", { waitUntil: "domcontentloaded" });
  await expect.poll(() => page.evaluate(() => Boolean(window.__lovecDebug))).toBe(true);

  await page.evaluate(() => {
    window.__lovecDebug.startLevel(0);
    window.__lovecDebug.setPlayer(790, 520);
    window.__lovecDebug.setPatrolMotion("tractor", {
      x:620,y:430,speed:0,angle:0,working:true,resetMotion:true,
      points:[{x:620,y:430},{x:930,y:430},{x:930,y:680}],index:1
    });
    document.getElementById("hud")?.classList.add("hidden");
    document.getElementById("controls")?.classList.add("hidden");
  });

  const initial = await page.evaluate(() => window.__lovecDebug.patrolSnapshot().find(p => p.type === "tractor"));
  await page.waitForTimeout(900);
  const stopped = await page.evaluate(() => window.__lovecDebug.patrolSnapshot().find(p => p.type === "tractor"));
  expect(stopped.moving).toBe(false);
  expect(Math.abs(stopped.wheelRotation - initial.wheelRotation)).toBeLessThan(.001);

  await page.evaluate(() => window.__lovecDebug.setPatrolMotion("tractor", { speed:145, working:true }));
  await page.waitForTimeout(2500);
  const driving = await page.evaluate(() => window.__lovecDebug.patrolSnapshot().find(p => p.type === "tractor"));
  expect(driving.moving).toBe(true);
  expect(driving.distanceTravelled).toBeGreaterThan(250);
  expect(Math.abs(driving.wheelRotation)).toBeGreaterThan(2);

  await page.waitForTimeout(1700);
  const turned = await page.evaluate(() => window.__lovecDebug.patrolSnapshot().find(p => p.type === "tractor"));
  expect(turned.visualAngle).toBeGreaterThan(.35);
  expect(turned.distanceTravelled).toBeGreaterThan(driving.distanceTravelled);

  await page.evaluate(() => window.__lovecDebug.setPatrolMotion("tractor", { speed:0 }));
  await page.waitForTimeout(450);
  const stopA = await page.evaluate(() => window.__lovecDebug.patrolSnapshot().find(p => p.type === "tractor"));
  await page.waitForTimeout(700);
  const stopB = await page.evaluate(() => window.__lovecDebug.patrolSnapshot().find(p => p.type === "tractor"));
  expect(stopB.moving).toBe(false);
  expect(Math.abs(stopB.wheelRotation - stopA.wheelRotation)).toBeLessThan(.001);
  expect(Math.abs(stopB.distanceTravelled - stopA.distanceTravelled)).toBeLessThan(.001);
});
