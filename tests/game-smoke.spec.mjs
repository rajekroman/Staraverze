import { test, expect } from "@playwright/test";

const LEVELS = ["chlum", "locenice", "nesmen", "besednice", "malse"];
const SAVE_KEY = "lovecVltavinuRebornSaveV5_4_2";
const LEGACY_SAVE_KEY = "lovecVltavinuRebornSaveV5_2";

test("audit: mezerník aktivuje tlačítko nabídky", async ({ page }) => {
  await page.goto("/");
  await page.locator("#playButton").focus();
  await page.keyboard.press("Space");
  await expect(page.locator("#briefScreen")).toHaveClass(/visible/);
});

test("audit: kopání lze pozastavit a dokončit právě jednou", async ({ page }) => {
  await openDebug(page);
  await page.evaluate(() => window.__lovecDebug.startDigChallenge());
  await page.locator("#digPauseButton").click();
  await expect(page.locator("#pauseScreen")).toHaveClass(/visible/);
  const time = await page.evaluate(() => window.__lovecDebug.digSnapshot().timeLeft);
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => window.__lovecDebug.digSnapshot().timeLeft)).toBe(time);
  await page.locator("#resumeButton").click();
  await expect(page.locator("#digScreen")).toHaveClass(/visible/);
  for (let i=0;i<3;i++) {
    await page.evaluate(() => { window.__lovecDebug.setDigSpeed(0); window.__lovecDebug.setDigMarker(); });
    await page.keyboard.press("Space");
    if(i<2) await page.waitForTimeout(120);
  }
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.snapshot().state.stones)).toBe(1);
  await page.waitForTimeout(200);
  expect((await page.evaluate(() => window.__lovecDebug.snapshot())).state.stones).toBe(1);
});

test("audit: chybně určený vzorek lze dohledat a opravit", async ({ page }) => {
  await openDebug(page);
  await page.evaluate(() => { window.__lovecDebug.startLevel(1); window.__lovecDebug.setPlayer(420,850); });
  await page.keyboard.press("Space");
  await page.keyboard.press("Space");
  await expect(page.locator("#identifyScreen")).toHaveClass(/visible/);
  const real = ["Olivový úlomek","Hnědozelený splash","Drobný celotvar"].includes(await page.locator("#sampleTitle").textContent());
  await page.locator(real?"#glassButton":"#realButton").click();
  await page.evaluate(() => window.__lovecDebug.setScanCooldown(0));
  await page.keyboard.press("Space");
  await expect(page.locator("#actionText")).toHaveText("SEBRAT");
  await page.keyboard.press("Space");
  await expect(page.locator("#identifyScreen")).toHaveClass(/visible/);
  await page.locator(real?"#realButton":"#glassButton").click();
  await expect(page.locator("#objectiveLabel")).toHaveText(real?"Správně 1/5 · pravé 1/3":"Správně 1/5 · pravé 0/3");
});

test("audit: skrytí stránky pozastaví kopání a odchod zruší odměnu", async ({ page }) => {
  await openDebug(page);
  await page.evaluate(() => {
    window.__lovecDebug.startDigChallenge();
    Object.defineProperty(document,"hidden",{configurable:true,value:true});
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.locator("#pauseScreen")).toHaveClass(/visible/);
  const time=await page.evaluate(() => window.__lovecDebug.digSnapshot().timeLeft);
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => window.__lovecDebug.digSnapshot().timeLeft)).toBe(time);
  await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event("visibilitychange")); });
  await page.locator("#menuButton").click();
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => window.__lovecDebug.snapshot().mode)).toBe("menu");
  expect(await page.evaluate(() => window.__lovecDebug.snapshot().state.stones)).toBe(0);
});

test("audit: odložený Franta respektuje pauzu a neopustí svůj level", async ({ page }) => {
  await openDebug(page);
  const collectPapers=() => page.evaluate(() => {
    window.__lovecDebug.startLevel(4);
    for(const [x,y] of [[760,860],[1040,560],[1280,360]]){
      window.__lovecDebug.setPlayer(x,y);
      dispatchEvent(new KeyboardEvent("keydown",{code:"Space"}));
      dispatchEvent(new KeyboardEvent("keyup",{code:"Space"}));
    }
    dispatchEvent(new KeyboardEvent("keydown",{code:"Escape"}));
  });
  await collectPapers();
  await page.waitForTimeout(650);
  expect(await page.evaluate(() => window.__lovecDebug.snapshot().boss)).toBeNull();
  await page.locator("#resumeButton").click();
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.snapshot().boss?.name)).toBe("franta");
  await collectPapers();
  await page.evaluate(() => window.__lovecDebug.startLevel(0));
  await page.waitForTimeout(650);
  expect(await page.evaluate(() => window.__lovecDebug.snapshot().boss)).toBeNull();
});

test("audit: opakovaný úder nepřenačítá stejný zvuk", async ({ page }) => {
  await page.addInitScript(() => {
    window.auditAudio={assignments:[],plays:[]};
    const source=Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype,"src");
    Object.defineProperty(HTMLMediaElement.prototype,"src",{...source,set(value){window.auditAudio.assignments.push(value);source.set.call(this,value);}});
    HTMLMediaElement.prototype.play=function(){window.auditAudio.plays.push(this.src);return Promise.resolve();};
  });
  await openDebug(page);
  await page.evaluate(() => {window.__lovecDebug.startDigChallenge();window.auditAudio.assignments=[];});
  for(let i=0;i<2;i++){
    await page.evaluate(() => {window.__lovecDebug.setDigSpeed(0);window.__lovecDebug.setDigMarker();});
    await page.keyboard.press("Space");
    await page.waitForTimeout(150);
  }
  const audio=await page.evaluate(() => window.auditAudio);
  expect(audio.plays.filter(src=>src.endsWith("/dig-hit.mp3"))).toHaveLength(2);
  expect(audio.assignments).toEqual([]);
});

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

  await expect.poll(
    () => page.locator("#game").evaluate(canvas => {
      const context = canvas.getContext("2d");
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const xs = [24, 45, 72].map(value => Math.round(value * scaleX));
      const ys = [rect.height * .25, rect.height * .5, rect.height * .75].map(value => Math.round(value * scaleY));
      let brightness = 0;
      let samples = 0;
      for (const x of xs) {
        for (const y of ys) {
          const pixel = context.getImageData(x, y, 1, 1).data;
          brightness += pixel[0] + pixel[1] + pixel[2];
          samples += 3;
        }
      }
      return brightness / samples;
    }),
    { timeout: 5_000 }
  ).toBeGreaterThan(5);

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
  expect(restored.save).toMatchObject({ version: "5.4.2" });
  expect(restored.save.state).toMatchObject({ levelIndex: 4, score: 420, sound: false });
  expect(restored.save.state.stones).toHaveLength(1);
  expect(restored.save.state.stones[0]).toMatchObject({ weight: 2.5, quality: 100, value: 900 });
  expect(restored.save.state.perks.boots).toBe(3);
  expect(errors).toEqual([]);
});

test("rozehraný level obnoví nálezy, runtime i pozici", async ({ page }) => {
  await openDebug(page);
  await page.evaluate(() => {
    window.__lovecDebug.startLevel(0);
    window.__lovecDebug.setPlayer(500,840);
    dispatchEvent(new KeyboardEvent("keydown", { code: "Space" }));
    dispatchEvent(new KeyboardEvent("keyup", { code: "Space" }));
    dispatchEvent(new KeyboardEvent("keydown", { code: "Space" }));
    dispatchEvent(new KeyboardEvent("keyup", { code: "Space" }));
  });
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.snapshot().state.stones)).toBe(1);
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
  expect(saved.world.id).toBe("chlum");
  expect(saved.world.runtime.collected).toBe(1);
  expect(saved.player).toMatchObject({ x: 500, y: 840 });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator("#continueButton").click();
  await page.locator("#briefButton").click();
  const restored = await page.evaluate(() => window.__lovecDebug.snapshot());
  expect(restored.player).toMatchObject({ x: 500, y: 840 });
  expect(restored.world.stones).toBe(8);
  expect(restored.world.surfaceVisible).toBe(1);
  expect(restored.state.stones).toBe(1);
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

test("Ločenice projdou reálným radarem a určením pravého i chybně označeného vzorku", async ({ page }) => {
  const errors = watchErrors(page);
  const realTitles = new Set(["Olivový úlomek", "Hnědozelený splash", "Drobný celotvar"]);

  async function openFirstSample() {
    await page.evaluate(() => {
      window.__lovecDebug.startLevel(1);
      window.__lovecDebug.setPlayer(420, 850);
    });
    await page.keyboard.press("Space");
    await expect.poll(() => page.evaluate(() => window.__lovecDebug.snapshot().world.surfaceVisible)).toBeGreaterThan(0);
    await expect(page.locator("#actionText")).toHaveText("SEBRAT");
    await page.keyboard.press("Space");
    await expect(page.locator("#identifyScreen")).toHaveClass(/visible/);
    const title = await page.locator("#sampleTitle").textContent();
    return { title, real: realTitles.has(title || "") };
  }

  await openDebug(page);

  const correctSample = await openFirstSample();
  const beforeCorrect = await page.evaluate(() => window.__lovecDebug.snapshot());
  await page.locator(correctSample.real ? "#realButton" : "#glassButton").click();
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.snapshot().mode)).toBe("playing");
  await expect(page.locator("#objectiveLabel")).toHaveText(
    correctSample.real ? "Správně 1/5 · pravé 1/3" : "Správně 1/5 · pravé 0/3"
  );
  const afterCorrect = await page.evaluate(() => window.__lovecDebug.snapshot());
  expect(afterCorrect.state.stones).toBe(beforeCorrect.state.stones + (correctSample.real ? 1 : 0));
  expect(afterCorrect.heat).toBeLessThanOrEqual(beforeCorrect.heat + 0.1);

  const wrongSample = await openFirstSample();
  const beforeWrong = await page.evaluate(() => window.__lovecDebug.snapshot());
  await page.locator(wrongSample.real ? "#glassButton" : "#realButton").click();
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.snapshot().mode)).toBe("playing");
  await expect(page.locator("#objectiveLabel")).toHaveText("Správně 0/5 · pravé 0/3");
  const afterWrong = await page.evaluate(() => window.__lovecDebug.snapshot());
  expect(afterWrong.heat).toBeGreaterThan(beforeWrong.heat);
  expect(afterWrong.state.stones).toBe(0);
  expect(errors).toEqual([]);
});

test("Nesměň vyžaduje souhlas a projde třemi profily až k odchodu", async ({ page }) => {
  const errors = watchErrors(page);
  const profiles = [
    { x: 520, y: 880, alreadyRevealed: true },
    { x: 930, y: 860, alreadyRevealed: false },
    { x: 1290, y: 740, alreadyRevealed: false }
  ];

  async function completeDig() {
    await expect(page.locator("#digScreen")).toHaveClass(/visible/);
    await page.evaluate(() => {
      window.__lovecDebug.setDigTime(4);
      window.__lovecDebug.setDigSpeed(0);
    });

    for (let hit = 1; hit <= 3; hit += 1) {
      await page.evaluate(() => {
        const snapshot = window.__lovecDebug.digSnapshot();
        window.__lovecDebug.setDigSpeed(0);
        window.__lovecDebug.setDigMarker(snapshot.zoneCenter);
      });
      await page.keyboard.press("Space");
      if (hit < 3) {
        await expect.poll(() => page.evaluate(() => window.__lovecDebug.digSnapshot().hits)).toBe(hit);
        await expect.poll(() => page.evaluate(() => window.__lovecDebug.digSnapshot().inputLocked)).toBe(false);
      }
    }

    await expect.poll(() => page.evaluate(() => window.__lovecDebug.snapshot().mode)).toBe("playing");
    await expect(page.locator("#actionText")).toHaveText("ZAHRABAT");
    await page.keyboard.press("Space");
  }

  await openDebug(page);
  await page.evaluate(() => {
    window.__lovecDebug.startLevel(2);
    window.__lovecDebug.setPlayer(520, 880);
    window.__lovecDebug.setScanCooldown(0);
  });
  await expect(page.locator("#objectiveLabel")).toHaveText("Získej souhlas lesníka");

  await page.keyboard.press("Space");
  await expect(page.locator("#actionText")).toHaveText("KOPAT");
  await page.keyboard.press("Space");
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.snapshot().mode)).toBe("playing");
  await expect(page.locator("#digScreen")).not.toHaveClass(/visible/);
  await expect(page.locator("#toast")).toContainText("souhlas lesníka");
  await expect(page.locator("#objectiveLabel")).toHaveText("Získej souhlas lesníka");

  await page.evaluate(() => window.__lovecDebug.setPlayer(300, 990));
  await expect(page.locator("#actionText")).toHaveText("MLUVIT");
  await page.keyboard.press("Space");
  await expect(page.locator("#dialogScreen")).toHaveClass(/visible/);
  await expect(page.locator("#dialogName")).toHaveText("LESNÍK");
  await page.locator("#dialogButton").click();
  await expect(page.locator("#objectiveLabel")).toHaveText("Profily 0/3 · zahrabáno 0/3");

  for (let index = 0; index < profiles.length; index += 1) {
    const profile = profiles[index];
    await page.evaluate(({ x, y }) => {
      window.__lovecDebug.setPlayer(x, y);
      window.__lovecDebug.setScanCooldown(0);
    }, profile);

    if (!profile.alreadyRevealed) {
      await page.keyboard.press("Space");
      await expect(page.locator("#actionText")).toHaveText("KOPAT");
    } else {
      await expect(page.locator("#actionText")).toHaveText("KOPAT");
    }

    await page.keyboard.press("Space");
    await completeDig();
    await expect(page.locator("#objectiveLabel")).toHaveText(
      `Profily ${index + 1}/3 · zahrabáno ${index + 1}/3`
    );
  }

  await page.evaluate(() => window.__lovecDebug.setPlayer(1650, 150));
  await expect(page.locator("#actionText")).toHaveText("ODEJÍT");
  await page.keyboard.press("Space");
  await expect(page.locator("#perkScreen")).toHaveClass(/visible/);
  expect(errors).toEqual([]);
});

test("Malše projdou dokumenty, Frantou a vstupem do Slávie", async ({ page }) => {
  const errors = watchErrors(page);
  const papers = [
    { x: 760, y: 860, objective: "Dokumenty 1/3" },
    { x: 1040, y: 560, objective: "Dokumenty 2/3" },
    { x: 1280, y: 360, objective: "Dokumenty 3/3" }
  ];

  await openDebug(page);
  await page.evaluate(() => window.__lovecDebug.startLevel(4));
  await expect(page.locator("#objectiveLabel")).toHaveText("Dokumenty 0/3");

  for (let index = 0; index < papers.length; index += 1) {
    const paper = papers[index];
    await page.evaluate(({ x, y }) => window.__lovecDebug.setPlayer(x, y), paper);
    await expect(page.locator("#actionText")).toHaveText("SEBRAT");
    await page.keyboard.press("Space");
    if (index < papers.length - 1) {
      await expect(page.locator("#objectiveLabel")).toHaveText(paper.objective);
    } else {
      await expect(page.locator("#objectiveLabel")).toHaveText(/Dokumenty 3\/3|Dožeň Frantu/);
    }
  }

  await page.evaluate(() => {
    window.__lovecDebug.setPlayer(720, 1060);
    window.__lovecDebug.setHeat(0);
  });

  await expect.poll(
    () => page.evaluate(() => window.__lovecDebug.snapshot().boss?.name || null),
    { timeout: 5_000 }
  ).toBe("franta");
  await expect(page.locator("#objectiveLabel")).toHaveText("Dožeň Frantu");
  await expect(page.locator("#bossName")).toHaveText("FETÁK FRANTA");

  for (let hit = 1; hit <= 2; hit += 1) {
    await page.evaluate(() => {
      const player = window.__lovecDebug.snapshot().player;
      window.__lovecDebug.setBossPose(player.x + 42, player.y, 0);
    });
    await expect(page.locator("#actionText")).toHaveText("CHYTIT");
    await page.keyboard.press("Space");

    if (hit === 1) {
      await expect.poll(() => page.evaluate(() => window.__lovecDebug.snapshot().boss.hits)).toBe(1);
      expect(await page.evaluate(() => window.__lovecDebug.snapshot().boss.active)).toBe(true);
    }
  }

  await expect.poll(
    () => page.evaluate(() => window.__lovecDebug.snapshot().boss),
    { timeout: 5_000 }
  ).toMatchObject({ name: "franta", active: false, hits: 2, maxHits: 2 });
  await expect(page.locator("#objectiveLabel")).toHaveText("Vstup do Slávie");

  await page.evaluate(() => window.__lovecDebug.setPlayer(1450, 250));
  await expect(page.locator("#actionText")).toHaveText("ODEJÍT");
  await page.keyboard.press("Space");
  await expect(page.locator("#juryScreen")).toHaveClass(/visible/);
  expect(errors).toEqual([]);
});

test("Chlum projde radarem, šesti povrchovými nálezy a odchodem", async ({ page }) => {
  const errors = watchErrors(page);
  const stones = [
    { x: 500, y: 840 },
    { x: 820, y: 910 },
    { x: 1120, y: 760 },
    { x: 1440, y: 900 },
    { x: 620, y: 480 },
    { x: 1500, y: 500 }
  ];

  await openDebug(page);
  await page.evaluate(() => window.__lovecDebug.startLevel(0));
  await expect(page.locator("#objectiveLabel")).toHaveText("Sběr z povrchu 0/6");

  for (let index = 0; index < stones.length; index += 1) {
    const stone = stones[index];
    await page.evaluate(({ x, y }) => {
      window.__lovecDebug.setPlayer(x, y);
      window.__lovecDebug.setHeat(0);
      window.__lovecDebug.setScanCooldown(0);
    }, stone);

    await page.keyboard.press("Space");
    await expect(page.locator("#actionText")).toHaveText("SEBRAT");
    await page.keyboard.press("Space");

    await expect(page.locator("#objectiveLabel")).toHaveText(`Sběr z povrchu ${index + 1}/6`);
    await expect.poll(() => page.evaluate(() => window.__lovecDebug.snapshot().state.stones)).toBe(index + 1);
  }

  await page.evaluate(() => {
    window.__lovecDebug.setPlayer(1650, 150);
    window.__lovecDebug.setHeat(0);
  });
  await expect(page.locator("#actionText")).toHaveText("ODEJÍT");
  await page.keyboard.press("Space");
  await expect(page.locator("#perkScreen")).toHaveClass(/visible/);
  expect(errors).toEqual([]);
});
