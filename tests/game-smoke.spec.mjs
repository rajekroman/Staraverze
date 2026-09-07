import { test, expect } from "@playwright/test";

const LEVELS = ["chlum", "locenice", "nesmen", "besednice", "malse"];
const SAVE_KEY = "lovecVltavinuRebornSaveV5_4_2";
const LEGACY_SAVE_KEY = "lovecVltavinuRebornSaveV5_2";

function watchErrors(page) {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("response", response => {
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });
  return errors;
}

async function openDebug(page) {
  await page.goto("/?debug=1", { waitUntil: "domcontentloaded" });
  await expect.poll(() => page.evaluate(() => Boolean(window.__lovecDebug))).toBe(true);
}

test("hlavní nabídka je celá dosažitelná v aktuálním viewportu", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const layout = await page.evaluate(() => ({
    width: innerWidth,
    height: innerHeight,
    controls: ["playButton", "howButton", "recordsButton"].map(id => {
      const rect = document.getElementById(id).getBoundingClientRect();
      return { id, left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
    })
  }));
  for (const control of layout.controls) {
    expect(control.left, `${control.id} left`).toBeGreaterThanOrEqual(0);
    expect(control.top, `${control.id} top`).toBeGreaterThanOrEqual(0);
    expect(control.right, `${control.id} right`).toBeLessThanOrEqual(layout.width);
    expect(control.bottom, `${control.id} bottom`).toBeLessThanOrEqual(layout.height);
  }
  expect(errors).toEqual([]);
});

test("všech pět levelů se spustí a vykreslí bez runtime chyby", async ({ page }) => {
  const errors = watchErrors(page);
  await openDebug(page);
  for (let index = 0; index < LEVELS.length; index += 1) {
    const started = await page.evaluate(level => window.__lovecDebug.startLevel(level), index);
    expect(started.level).toBe(LEVELS[index]);
    await page.waitForTimeout(250);
    const snapshot = await page.evaluate(() => window.__lovecDebug.snapshot());
    expect(snapshot).toMatchObject({ version: "5.4.2", mode: "playing", level: LEVELS[index] });
    const canvas = await page.locator("#game").evaluate(element => ({ width: element.width, height: element.height }));
    expect(canvas.width).toBeGreaterThan(300);
    expect(canvas.height).toBeGreaterThan(300);
  }
  expect(errors).toEqual([]);
});

test("noční Besednice nemá černou vymazanou plochu", async ({ page }) => {
  const errors = watchErrors(page);
  await openDebug(page);
  await page.evaluate(() => window.__lovecDebug.startLevel(3));
  await page.waitForTimeout(350);
  const sample = await page.locator("#game").evaluate(canvas => {
    const context = canvas.getContext("2d");
    const scaleX = canvas.width / canvas.getBoundingClientRect().width;
    const scaleY = canvas.height / canvas.getBoundingClientRect().height;
    const pixel = context.getImageData(Math.round(45 * scaleX), Math.round(canvas.height / 2), 1, 1).data;
    return [...pixel];
  });
  expect(sample.slice(0, 3).some(channel => channel > 5)).toBe(true);
  expect(errors).toEqual([]);
});

test("povrchové nálezy odhalí až radar a Chlum nemá kopací místa", async ({ page }) => {
  const errors = watchErrors(page);
  await openDebug(page);
  await page.evaluate(() => window.__lovecDebug.startLevel(0));
  let snapshot = await page.evaluate(() => window.__lovecDebug.snapshot());
  expect(snapshot.world).toEqual({ hotspots: 0, stones: 9, surfaceHidden: 9, surfaceVisible: 0 });

  await page.evaluate(() => {
    window.__lovecDebug.setPlayer(500, 840);
    dispatchEvent(new KeyboardEvent("keydown", { code: "Space", bubbles: true, cancelable: true }));
    dispatchEvent(new KeyboardEvent("keyup", { code: "Space", bubbles: true, cancelable: true }));
  });
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.snapshot().world.surfaceVisible)).toBeGreaterThan(0);

  await page.evaluate(() => window.__lovecDebug.startLevel(1));
  snapshot = await page.evaluate(() => window.__lovecDebug.snapshot());
  expect(snapshot.world).toMatchObject({ surfaceHidden: 9, surfaceVisible: 0 });
  await page.evaluate(() => {
    window.__lovecDebug.setPlayer(420, 850);
    dispatchEvent(new KeyboardEvent("keydown", { code: "Space", bubbles: true, cancelable: true }));
    dispatchEvent(new KeyboardEvent("keyup", { code: "Space", bubbles: true, cancelable: true }));
  });
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.snapshot().world.surfaceVisible)).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test("pauza a ztráta fokusu vždy uvolní pohyb", async ({ page }) => {
  const errors = watchErrors(page);
  await openDebug(page);
  await page.evaluate(() => window.__lovecDebug.startLevel(0));

  await page.keyboard.down("KeyD");
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.snapshot().input.x)).toBe(1);
  await page.locator("#pauseButton").click();
  await expect(page.locator("#pauseScreen")).toHaveClass(/visible/);
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.snapshot().input)).toEqual({ x: 0, y: 0, pressed: false });
  await expect.poll(() => page.evaluate(() => ({ vx: window.__lovecDebug.snapshot().player.vx, vy: window.__lovecDebug.snapshot().player.vy }))).toEqual({ vx: 0, vy: 0 });

  await page.locator("#resumeButton").click();
  await page.keyboard.down("KeyW");
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.snapshot().input.y)).toBe(-1);
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.snapshot().input)).toEqual({ x: 0, y: 0, pressed: false });
  await expect.poll(() => page.evaluate(() => ({ vx: window.__lovecDebug.snapshot().player.vx, vy: window.__lovecDebug.snapshot().player.vy }))).toEqual({ vx: 0, vy: 0 });
  expect(errors).toEqual([]);
});

test("hlavní postava drží svislou siluetu a zrcadlí se jen do stran", async ({ page }) => {
  const errors = watchErrors(page);
  await openDebug(page);
  await page.evaluate(() => window.__lovecDebug.startLevel(0));

  await page.keyboard.down("KeyA");
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.snapshot().player.facing)).toBe(-1);
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.snapshot().player.pose)).toBe("side");
  await page.keyboard.up("KeyA");

  const beforeUp = await page.evaluate(() => window.__lovecDebug.snapshot().player.y);
  await page.keyboard.down("KeyW");
  await expect.poll(() => page.evaluate(y => window.__lovecDebug.snapshot().player.y < y, beforeUp)).toBe(true);
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.snapshot().player.facing)).toBe(-1);
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.snapshot().player.pose)).toBe("back");
  await expect.poll(() => page.evaluate(() => Math.abs(window.__lovecDebug.snapshot().player.vx))).toBeLessThan(1);
  await page.keyboard.up("KeyW");

  await page.keyboard.down("KeyD");
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.snapshot().player.facing)).toBe(1);
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.snapshot().player.pose)).toBe("side");
  await page.keyboard.up("KeyD");

  await page.keyboard.down("KeyS");
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.snapshot().player.pose)).toBe("front");
  await expect.poll(() => page.evaluate(() => Math.abs(window.__lovecDebug.snapshot().player.vx))).toBeLessThan(1);
  await page.keyboard.up("KeyS");
  expect(errors).toEqual([]);
});

test("kopání reaguje na mezerník a po přesném úderu zrychluje", async ({ page }) => {
  const errors = watchErrors(page);
  await openDebug(page);
  const started = await page.evaluate(() => window.__lovecDebug.startDigChallenge(2));
  expect(started).toEqual({ mode: "dig", level: "nesmen" });
  await expect(page.locator("#digScreen")).toHaveClass(/visible/);
  await expect(page.locator("#digTimerFill")).toBeVisible();
  await page.evaluate(() => window.__lovecDebug.setDigTime(4));
  await page.evaluate(() => window.__lovecDebug.setDigSpeed(0));

  let previousSpeed = 0;
  for (let hit = 1; hit <= 3; hit += 1) {
    const before = await page.evaluate(() => {
      const snapshot = window.__lovecDebug.digSnapshot();
      window.__lovecDebug.setDigMarker(snapshot.zoneCenter);
      dispatchEvent(new KeyboardEvent("keydown", { code: "Space", bubbles: true, cancelable: true }));
      dispatchEvent(new KeyboardEvent("keyup", { code: "Space", bubbles: true, cancelable: true }));
      return snapshot;
    });
    previousSpeed = before.speed;
    if (hit < 3) {
      await expect.poll(() => page.evaluate(() => window.__lovecDebug.digSnapshot().hits)).toBe(hit);
      const after = await page.evaluate(() => window.__lovecDebug.digSnapshot());
      expect(after.speed).toBeGreaterThan(previousSpeed);
      if (hit === 1) {
        await expect(page.locator("#digFeedback")).toContainText("Přesně · tempo 1/3 · +0,5 s");
      }
      await expect.poll(() => page.evaluate(() => window.__lovecDebug.digSnapshot().inputLocked)).toBe(false);
    }
  }
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.snapshot().mode)).toBe("playing");

  await page.evaluate(() => {
    window.__lovecDebug.startDigChallenge(2);
    window.__lovecDebug.setDigSpeed(0);
    window.__lovecDebug.setDigMarker(window.__lovecDebug.digSnapshot().zoneCenter);
  });
  await page.locator("#digButton").click();
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.digSnapshot().hits)).toBe(1);
  expect(errors).toEqual([]);
});

test("starý nebo poškozený save se bezpečně obnoví", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto("/");
  await page.evaluate(({ legacyKey }) => {
    localStorage.clear();
    localStorage.setItem(legacyKey, JSON.stringify({
      version: "5.1.0",
      levelIndex: 999,
      score: "420",
      stones: [null, { id: "old", name: "Starý nález", locality: "Chlum", weight: "2.5", quality: 150, value: "900" }],
      perks: { boots: 99 },
      stats: { digs: "3" },
      sound: false
    }));
  }, { legacyKey: LEGACY_SAVE_KEY });
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator("#continueButton")).toBeVisible();
  await page.locator("#continueButton").click();
  await expect(page.locator("#briefKicker")).toHaveText("LOKALITA 5 / 5");
  await page.locator("#briefButton").click();
  const restored = await page.evaluate(({ saveKey }) => ({
    snapshot: window.__lovecDebug?.snapshot?.(),
    save: JSON.parse(localStorage.getItem(saveKey))
  }), { saveKey: SAVE_KEY });
  expect(restored.save).toMatchObject({ version: "5.4.2", levelIndex: 4, score: 420, sound: false });
  expect(restored.save.stones).toHaveLength(1);
  expect(restored.save.stones[0]).toMatchObject({ weight: 2.5, quality: 100, value: 900 });
  expect(restored.save.perks.boots).toBe(3);
  expect(errors).toEqual([]);
});

test("celá výprava projde z Chlumu až k porotě a výsledku", async ({ page }) => {
  const errors = watchErrors(page);
  await openDebug(page);
  await page.evaluate(() => localStorage.clear());

  await page.locator("#playButton").click();
  await expect(page.locator("#briefScreen")).toHaveClass(/visible/);

  for (let index = 0; index < LEVELS.length; index += 1) {
    await expect(page.locator("#briefKicker")).toHaveText(`LOKALITA ${index + 1} / ${LEVELS.length}`);
    await page.locator("#briefButton").click();

    await expect.poll(() => page.evaluate(() => window.__lovecDebug.snapshot().level)).toBe(LEVELS[index]);
    const completed = await page.evaluate(() => window.__lovecDebug.completeGoal());
    expect(completed).toMatchObject({ level: LEVELS[index], complete: true });

    await page.evaluate(() => window.__lovecDebug.exitCurrentLevel());

    if (index < LEVELS.length - 1) {
      await expect(page.locator("#perkScreen")).toHaveClass(/visible/);
      const perks = page.locator("#perkList .perk-option");
      await expect(perks.first()).toBeVisible();
      await perks.first().click();
      await expect(page.locator("#briefScreen")).toHaveClass(/visible/);
    }
  }

  await expect(page.locator("#juryScreen")).toHaveClass(/visible/);
  await expect(page.locator("#juryCount")).toHaveText("0 / 3");

  const stones = page.locator("#juryList .stone-card");
  expect(await stones.count()).toBeGreaterThanOrEqual(3);
  for (let index = 0; index < 3; index += 1) await stones.nth(index).click();

  await expect(page.locator("#juryCount")).toHaveText("3 / 3");
  await expect(page.locator("#juryButton")).toBeEnabled();
  await page.locator("#juryButton").click();

  await expect(page.locator("#resultScreen")).toHaveClass(/visible/);
  await expect(page.locator("#resultScore")).not.toHaveText("0");
  expect(await page.evaluate(saveKey => localStorage.getItem(saveKey), SAVE_KEY)).toBeNull();

  await page.locator("#resultRecordsButton").click();
  await expect(page.locator("#recordsList li").first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("krádež v Besednici zablokuje vstup a Karel jde porazit jen ve stun oknech", async ({ page }) => {
  const errors = watchErrors(page);
  await openDebug(page);
  await page.evaluate(() => window.__lovecDebug.startLevel(3));

  const triggered = await page.evaluate(() => window.__lovecDebug.triggerTheft());
  expect(triggered).toEqual({ shown: true, boss: "karel" });

  await page.keyboard.down("KeyD");
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.snapshot().input)).toEqual({ x: 0, y: 0, pressed: false });
  await page.keyboard.up("KeyD");
  await expect.poll(
    () => page.evaluate(() => window.__lovecDebug.snapshot().theftAlertShown),
    { timeout: 5_000 }
  ).toBe(false);

  await page.evaluate(() => {
    const player = window.__lovecDebug.snapshot().player;
    window.__lovecDebug.setBossPose(player.x + 42, player.y, 0);
    window.__lovecDebug.setBossStun(0);
  });
  await expect(page.locator("#actionText")).toHaveText("CHYTIT");
  await page.keyboard.press("Space");
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.snapshot().boss.hits)).toBe(0);

  for (let hit = 1; hit <= 3; hit += 1) {
    await page.evaluate(() => {
      const player = window.__lovecDebug.snapshot().player;
      window.__lovecDebug.setBossPose(player.x + 42, player.y, 0);
      window.__lovecDebug.setBossStun(5);
    });
    await expect(page.locator("#actionButton")).toHaveClass(/boss-ready/);
    await page.keyboard.press("Space");

    if (hit < 3) {
      await expect.poll(() => page.evaluate(() => window.__lovecDebug.snapshot().boss.hits)).toBe(hit);
      expect(await page.evaluate(() => window.__lovecDebug.snapshot().boss.active)).toBe(true);
    }
  }

  const defeated = await expect.poll(
    () => page.evaluate(() => window.__lovecDebug.snapshot()),
    { timeout: 5_000 }
  ).toMatchObject({
    boss: { name: "karel", active: false, hits: 3, maxHits: 3 },
    state: { stones: 1 }
  });
  expect(errors).toEqual([]);
});
