import { test, expect } from "@playwright/test";

test("car stop start distance wheels turn and stop evidence", async ({ page }) => {
  await page.goto("/?debug=1", { waitUntil: "domcontentloaded" });
  await expect.poll(() => page.evaluate(() => Boolean(window.__lovecDebug))).toBe(true);

  await page.evaluate(() => {
    window.__lovecDebug.startLevel(4);
    window.__lovecDebug.setPlayer(1070, 690);
    window.__lovecDebug.setPatrolMotion("car", {
      x:970,y:820,speed:0,angle:-Math.PI/2,resetMotion:true,collisionEnabled:false,
      points:[{x:970,y:820},{x:970,y:560},{x:1200,y:560}],index:1
    });
    window.__lovecDebug.snapCameraToPlayer();
    document.getElementById("hud")?.classList.add("hidden");
    document.getElementById("controls")?.classList.add("hidden");
  });

  const initial=await page.evaluate(() => window.__lovecDebug.patrolSnapshot().find(p => p.type === "car"));
  await page.waitForTimeout(800);
  const parked=await page.evaluate(() => window.__lovecDebug.patrolSnapshot().find(p => p.type === "car"));
  expect(parked.moving).toBe(false);
  expect(Math.abs(parked.wheelRotation-initial.wheelRotation)).toBeLessThan(.001);
  expect(Math.abs(parked.distanceTravelled-initial.distanceTravelled)).toBeLessThan(.001);

  await page.evaluate(() => window.__lovecDebug.setPatrolMotion("car",{speed:165}));
  await page.waitForTimeout(1400);
  const driving=await page.evaluate(() => window.__lovecDebug.patrolSnapshot().find(p => p.type === "car"));
  expect(driving.moving).toBe(true);
  expect(driving.distanceTravelled).toBeGreaterThan(180);
  expect(Math.abs(driving.wheelRotation)).toBeGreaterThan(5);

  await page.waitForTimeout(1000);
  const turned=await page.evaluate(() => window.__lovecDebug.patrolSnapshot().find(p => p.type === "car"));
  const turnDelta=Math.abs(Math.atan2(Math.sin(turned.visualAngle-initial.visualAngle),Math.cos(turned.visualAngle-initial.visualAngle)));
  expect(turnDelta).toBeGreaterThan(.35);
  expect(turned.distanceTravelled).toBeGreaterThan(driving.distanceTravelled);

  await page.evaluate(() => window.__lovecDebug.setPatrolMotion("car",{speed:0}));
  await page.waitForTimeout(500);
  const stopA=await page.evaluate(() => window.__lovecDebug.patrolSnapshot().find(p => p.type === "car"));
  await page.waitForTimeout(700);
  const stopB=await page.evaluate(() => window.__lovecDebug.patrolSnapshot().find(p => p.type === "car"));
  expect(stopB.moving).toBe(false);
  expect(Math.abs(stopB.wheelRotation-stopA.wheelRotation)).toBeLessThan(.001);
  expect(Math.abs(stopB.distanceTravelled-stopA.distanceTravelled)).toBeLessThan(.001);
});
