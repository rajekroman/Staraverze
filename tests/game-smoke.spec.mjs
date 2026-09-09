import { test, expect } from "@playwright/test";

const LEVELS = ["chlum", "locenice", "nesmen", "besednice", "malse"];
const SAVE_KEY = "lovecVltavinuRebornSaveV5_4_2";
const LEGACY_SAVE_KEY = "lovecVltavinuRebornSaveV5_2";

test("hráč je bezejmenný sběratel pro výstavu, Franta sbírá kvůli penězům", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const source = await page.evaluate(async () => (await fetch("/game.js")).text());
  expect(source).toContain("Ty vltavíny nehledáš kvůli penězům");
  expect(source).toContain("vybrat z ní nejzajímavější kusy pro výstavu na akci Na zelené vlně v KD Slávii");
  expect(source).toContain("Vltavíny sbírá na prodej");
  expect(source).toContain("utratit za automaty");
  expect(source).toContain("potřeboval bych tvůj názor na jeden Frantův vzorek");
  await expect(page.locator("#expertiseText")).toContainText("necháš své nejlepší kusy posoudit odborníkem");
  await expect(page.locator("#expertiseText")).toContainText("vystaví k nim certifikáty");
  expect(source).toContain('pendingTransition="expertise"');
  expect(source).toContain("složka s certifikáty skončí někde na nábřeží");
  expect(source).toContain("Dožeň Karla. Chyť ho, až se zastaví.");
  expect(source).toContain("Karel ti sebral ježka a utíká. Po sprintu se na chvíli zastaví — tehdy ho chyť.");
  expect(source).toContain("NAJDI SLOŽKU");
  expect(source).toContain("Vitrína je připravená. Porota přichází.");
  expect(source).toContain("Porota ocenila doložený původ a férový průběh");
  expect(source).toContain("Posuď povrch, tvar a pravidelnost vzorku.");
  expect(source).toContain("Olivově zelený nepravidelný kus s jamkami, kanálky a několika drobnými bublinkami.");
  expect(source).toContain("Jasně zelený kus s velmi hladkým povrchem, pravidelnými hranami a téměř stejnou tloušťkou.");
  expect(source).toContain('stav: ${qualityLabel} · ${s.quality} %');
  expect(source).toContain('Zásyp profilu · ${digHits}/3');
  expect(source).toContain("Hlína spadla vedle. Naber ji znovu.");
  expect(source).not.toContain("Hlína v díře · přenos");
  expect(source).not.toContain("Hlína spadla vedle · naber znovu");
  expect(source).not.toContain("Drž se úkolu a sleduj okolí.");
  expect(source).not.toContain("sběratel Franta");
  expect(source).not.toContain("SBĚRATEL FRANTA");
  expect(source).not.toContain("FETÁK FRANTA");
  expect(source).not.toContain("playerName");
});

test("menu jasně propaguje Na zelené vlně a vysvětluje cíl výpravy", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#titleScreen")).toHaveClass(/visible/);
  await expect(page.locator("#campaignEventCard")).toContainText("19. ZÁŘÍ 2026");
  await expect(page.locator("#campaignEventCard")).toContainText("České Budějovice");
  await expect(page.locator("#campaignEventCard")).toContainText("KD SLÁVIE");
  await expect(page.locator(".campaign-storyline")).toContainText("FINÁLE NA AKCI");
  await expect(page.locator("#titleScreen .subtitle")).toContainText("Nasbírej nejkrásnější vltavíny a doraz s nimi na akci");
  await expect(page.locator("#playButton")).toContainText("VYRAZIT ZA VLTAVÍNY");
  await expect(page.locator('a[href="https://www.nazelenevlne.cz"]')).toHaveCount(3);
  await expect(page.locator(".nzv-brand-lockup img")).toHaveAttribute("src", "./assets/ui/nzv-logo-purple.png");
  await expect(page.locator(".nzv-brand-lockup")).toBeVisible();
  await expect(page.locator("#campaignEventCard")).toBeVisible();
  await expect(page.locator("#playButton")).toBeVisible();

  const promoBounds = await page.evaluate(() => {
    const viewport = { width: innerWidth, height: innerHeight };
    const selectors = [".nzv-brand-lockup", "#campaignEventCard", "#playButton"];
    return { viewport, boxes: selectors.map(selector => {
      const r = document.querySelector(selector).getBoundingClientRect();
      return { selector, left:r.left, top:r.top, right:r.right, bottom:r.bottom };
    }) };
  });
  for (const box of promoBounds.boxes) {
    expect(box.left, box.selector).toBeGreaterThanOrEqual(-1);
    expect(box.right, box.selector).toBeLessThanOrEqual(promoBounds.viewport.width + 1);
    expect(box.top, box.selector).toBeGreaterThanOrEqual(-1);
    expect(box.bottom, box.selector).toBeLessThanOrEqual(promoBounds.viewport.height + 1);
  }

  await page.goto("/?debug=1", { waitUntil: "domcontentloaded" });
  await expect.poll(() => page.evaluate(() => Boolean(window.__lovecDebug))).toBe(true);
  await page.evaluate(() => window.__lovecDebug.startLevel(0));
  await expect(page.locator(".campaign-hud-badge")).toContainText("NA ZELENÉ VLNĚ");
  await expect(page.locator(".campaign-hud-badge")).toContainText("19. 9. 2026");
});

test("audit: mezerník aktivuje tlačítko nabídky", async ({ page }) => {
  await page.goto("/");
  await page.locator("#playButton").focus();
  await page.keyboard.press("Space");
  await expect(page.locator("#briefScreen")).toHaveClass(/visible/);
});

test("audit: kopání přes pauzu zmrazí čas i odloženou odměnu a dokončí se právě jednou", async ({ page }) => {
  await openDebug(page);
  await page.evaluate(() => window.__lovecDebug.startDigChallenge());

  await page.locator("#digPauseButton").click();
  await expect(page.locator("#pauseScreen")).toHaveClass(/visible/);
  const time = await page.evaluate(() => window.__lovecDebug.digSnapshot().timeLeft);
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.__lovecDebug.digSnapshot().timeLeft)).toBe(time);
  await page.locator("#resumeButton").click();
  await expect(page.locator("#digScreen")).toHaveClass(/visible/);
  await expect(page.locator("#digPauseButton")).toBeFocused();

  await page.locator("#digButton").focus();
  for (let i=0;i<3;i++) {
    await page.evaluate(() => {
      window.__lovecDebug.setDigSpeed(0);
      window.__lovecDebug.setDigMarker(window.__lovecDebug.digSnapshot().zoneCenter);
    });
    await page.keyboard.press("Space");
    if(i<2) await page.waitForTimeout(125);
  }

  await page.keyboard.press("Escape");
  await expect(page.locator("#pauseScreen")).toHaveClass(/visible/);
  const pending = await page.evaluate(() => window.__lovecDebug.digSnapshot());
  expect(pending.hits).toBe(3);
  expect(pending.finishDelay).toBeGreaterThan(0);
  expect((await page.evaluate(() => window.__lovecDebug.snapshot())).state.stones).toBe(0);
  await page.waitForTimeout(500);
  const frozen = await page.evaluate(() => window.__lovecDebug.digSnapshot());
  expect(frozen.finishDelay).toBe(pending.finishDelay);
  expect(frozen.timeLeft).toBe(pending.timeLeft);

  await page.keyboard.press("Escape");
  await expect(page.locator("#digScreen")).toHaveClass(/visible/);
  // Pending completion resumes immediately; focus restoration itself is covered
  // by the dedicated non-pending pause/resume accessibility test below.
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.snapshot().state.stones)).toBe(1);
  const score = await page.evaluate(() => window.__lovecDebug.snapshot().state.score);
  await page.waitForTimeout(500);
  const stable = await page.evaluate(() => window.__lovecDebug.snapshot());
  expect(stable.state.stones).toBe(1);
  expect(stable.state.score).toBe(score);
});

test("audit: chybně určený vzorek lze dohledat a opravit", async ({ page }) => {
  await openDebug(page);
  await page.evaluate(() => { window.__lovecDebug.startLevel(1); window.__lovecDebug.setPlayer(420,850); });
  await page.keyboard.press("Space");
  await page.keyboard.press("Space");
  await expect(page.locator("#identifyScreen")).toHaveClass(/visible/);
  const real = ["Olivová kapka","Hnědozelená kapka","Drobný celotvar"].includes(await page.locator("#sampleTitle").textContent());
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

test("audit: Franta se nespustí před potvrzeným odhalením podvodu ani přes pauzu", async ({ page }) => {
  await openDebug(page);
  await page.evaluate(() => window.__lovecDebug.startLevel(4));
  await recoverMalseCertificates(page);

  await page.evaluate(() => window.__lovecDebug.setPlayer(1450,250));
  await page.keyboard.press("Space");
  await page.locator("#dialogButton").click();

  for (const [x,y] of [[760,860],[1040,560],[1280,360]]) {
    await page.evaluate(([px,py]) => window.__lovecDebug.setPlayer(px,py), [x,y]);
    await page.keyboard.press("Space");
  }
  expect(await page.evaluate(() => window.__lovecDebug.snapshot().boss)).toBeNull();

  await page.keyboard.press("Escape");
  await expect(page.locator("#pauseScreen")).toHaveClass(/visible/);
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => window.__lovecDebug.snapshot().boss)).toBeNull();
  await page.locator("#resumeButton").click();

  await page.evaluate(() => window.__lovecDebug.setPlayer(1450,250));
  await page.keyboard.press("Space");
  await expect(page.locator("#fraudScreen")).toHaveClass(/visible/);
  await page.locator("#fraudWrongButton").click();
  expect(await page.evaluate(() => window.__lovecDebug.snapshot().boss)).toBeNull();
  await page.locator("#fraudButton").click();
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.snapshot().boss?.name)).toBe("franta");

  await page.evaluate(() => window.__lovecDebug.startLevel(0));
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => window.__lovecDebug.snapshot().boss)).toBeNull();
});

test("render: viewport culling vynechá objekty mimo kameru a referenční scénu nechá kompletní", async ({ page }) => {
  await openDebug(page);
  await page.evaluate(() => {
    window.__lovecDebug.startLevel(2);
    window.__lovecDebug.setPlayer(360,1050);
    window.__lovecDebug.snapCameraToPlayer();
  });
  await page.waitForTimeout(120);
  const live = await page.evaluate(() => window.__lovecDebug.snapshot().renderStats);
  expect(live.candidates).toBeGreaterThan(100);
  expect(live.culled).toBeGreaterThan(0);
  expect(live.rendered + live.culled).toBe(live.candidates);

  await page.evaluate(() => window.__lovecDebug.startNesmenReference());
  // WebKit can defer the first reference-scene RAF while media/resources settle; wait for rendered state, not wall time.
  await expect.poll(
    () => page.evaluate(() => window.__lovecDebug.snapshot().renderStats.culled),
    { timeout: 2_000 }
  ).toBe(0);
  const reference = await page.evaluate(() => window.__lovecDebug.snapshot().renderStats);
  expect(reference.candidates).toBeGreaterThan(0);
  expect(reference.rendered).toBe(reference.candidates);
});

test("audio: continue načte mute před prvním playbackem", async ({ page }) => {
  await page.addInitScript(() => {
    window.auditAudio={plays:[],pauses:[]};
    HTMLMediaElement.prototype.play=function(){window.auditAudio.plays.push(this.src);return Promise.resolve();};
    HTMLMediaElement.prototype.pause=function(){window.auditAudio.pauses.push(this.src);};
  });
  await page.goto("/?debug=1", { waitUntil: "domcontentloaded" });
  await page.evaluate(({ saveKey }) => {
    localStorage.clear();
    localStorage.setItem(saveKey, JSON.stringify({
      version:"5.4.2",
      state:{version:"5.4.2",levelIndex:0,stones:[],sound:false}
    }));
  }, { saveKey: SAVE_KEY });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.evaluate(() => { window.auditAudio.plays=[]; });
  await page.locator("#continueButton").click();
  await expect(page.locator("#briefScreen")).toHaveClass(/visible/);
  const audioState=await page.evaluate(() => ({
    audit:window.auditAudio,
    engine:window.__lovecDebug.audioSnapshot(),
    text:document.getElementById("soundButton").textContent,
    pressed:document.getElementById("soundButton").getAttribute("aria-pressed")
  }));
  expect(audioState.audit.plays).toEqual([]);
  expect(audioState.engine).toMatchObject({enabled:false,started:true,lifecyclePaused:true});
  expect(audioState.text).toBe("×");
  expect(audioState.pressed).toBe("false");
});

test("audio: pause a background zastaví celý lifecycle", async ({ page }) => {
  await page.addInitScript(() => {
    window.auditAudio={plays:[],pauses:[]};
    HTMLMediaElement.prototype.play=function(){window.auditAudio.plays.push(this.src);return Promise.resolve();};
    HTMLMediaElement.prototype.pause=function(){window.auditAudio.pauses.push(this.src);};
  });
  await page.goto("/?debug=1", { waitUntil: "domcontentloaded" });
  await page.locator("#playButton").click();
  await page.locator("#briefButton").click();
  await page.evaluate(() => { window.auditAudio.pauses=[]; });
  await page.locator("#pauseButton").click();
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.audioSnapshot().lifecyclePaused)).toBe(true);
  expect((await page.evaluate(() => window.auditAudio.pauses.length))).toBeGreaterThan(1);
  await page.locator("#resumeButton").click();
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.audioSnapshot().lifecyclePaused)).toBe(false);
  await page.evaluate(() => {
    Object.defineProperty(document,"hidden",{configurable:true,value:true});
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.locator("#pauseScreen")).toHaveClass(/visible/);
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.audioSnapshot().lifecyclePaused)).toBe(true);
  await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event("visibilitychange")); });
});

test("audio: rychlý theme switch se po mute nesmí opožděně znovu spustit", async ({ page }) => {
  await page.addInitScript(() => {
    window.auditAudio={plays:[],pauses:[]};
    HTMLMediaElement.prototype.play=function(){window.auditAudio.plays.push(this.src);return Promise.resolve();};
    HTMLMediaElement.prototype.pause=function(){window.auditAudio.pauses.push(this.src);};
  });
  await page.goto("/?debug=1", { waitUntil: "domcontentloaded" });
  await page.locator("#playButton").click();
  await page.locator("#briefButton").click();
  await page.evaluate(() => {
    window.__lovecDebug.setAudioTheme("night");
    window.__lovecDebug.setAudioTheme("city");
  });
  await page.locator("#soundButton").click();
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.audioSnapshot().enabled)).toBe(false);
  const playsAfterMute=await page.evaluate(() => window.auditAudio.plays.length);
  await page.waitForTimeout(320);
  expect(await page.evaluate(() => window.auditAudio.plays.length)).toBe(playsAfterMute);
  expect(await page.evaluate(() => window.__lovecDebug.audioSnapshot().lifecyclePaused)).toBe(true);
});

test("hudba: score běží po startu, pauza ho zastaví a menu ho obnoví", async ({ page }) => {
  await page.goto("/?debug=1", { waitUntil: "domcontentloaded" });
  await page.locator("#playButton").click();
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.audioSnapshot().scoreRunning)).toBe(true);
  expect(await page.evaluate(() => window.__lovecDebug.audioSnapshot().theme)).toBe("field");

  await page.locator("#briefButton").click();
  await page.locator("#pauseButton").click();
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.audioSnapshot().scoreRunning)).toBe(false);
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.audioSnapshot().lifecyclePaused)).toBe(true);

  await page.locator("#menuButton").click();
  await expect(page.locator("#titleScreen")).toHaveClass(/visible/);
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.audioSnapshot().scoreRunning)).toBe(true);
  const menuAudio=await page.evaluate(() => window.__lovecDebug.audioSnapshot());
  expect(menuAudio.theme).toBe("menu");
  expect(menuAudio.lifecyclePaused).toBe(false);
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
  // Audio playback is intentionally not asserted here: autoplay policy may
  // suppress play() in headless CI. The regression guard is that the source
  // is assigned once during engine setup and never reloaded per hit.
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

async function recoverMalseCertificates(page) {
  await page.evaluate(() => {
    window.__lovecDebug.setPlayer(720,1060);
    window.__lovecDebug.setScanCooldown(0);
  });
  await page.keyboard.press("Space");
  await page.evaluate(() => window.__lovecDebug.setPlayer(880,1030));
  await expect(page.locator("#actionText")).toHaveText("VZÍT SLOŽKU");
  await page.keyboard.press("Space");
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.malseSnapshot()?.certificateRecovered)).toBe(true);
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
  await expect(page.locator("#pauseButton")).toBeFocused();
  await page.locator("#game").focus();
  await expect(page.locator("#game")).toBeFocused();
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

test("pěší NPC drží svislou siluetu a používají stejné směrové pózy jako hráč", async ({ page }) => {
  const errors = watchErrors(page);
  await openDebug(page);
  await page.evaluate(() => window.__lovecDebug.startLevel(0));

  await expect.poll(() => page.evaluate(() => {
    const patrol=window.__lovecDebug.patrolSnapshot().find(item => item.type === "farmer");
    return patrol ? { facing: patrol.facing, pose: patrol.pose, moving: patrol.moving } : null;
  })).toEqual({ facing: -1, pose: "back", moving: true });

  const actorSource = await page.evaluate(async () => {
    const source = await (await fetch("./game.js")).text();
    return source.slice(source.indexOf("function drawActor"), source.indexOf("function drawPlayer"));
  });
  expect(actorSource).toContain("ctx.scale(facing,1)");
  expect(actorSource).not.toContain("ctx.rotate(");

  const spawnedRival = await page.evaluate(() => {
    window.__lovecDebug.startLevel(4);
    window.__lovecDebug.spawnBoss("franta");
    return window.__lovecDebug.rivalSnapshot();
  });
  expect(spawnedRival).toMatchObject({name:"franta",active:true});
  expect(["front","back","side"]).toContain(spawnedRival.pose);
  expect(Math.abs(spawnedRival.facing)).toBe(1);

  await page.evaluate(() => {
    const rival=window.__lovecDebug.rivalSnapshot();
    window.__lovecDebug.setBossPose(rival.x,rival.y,rival.angle);
    window.__lovecDebug.setBossStun(1);
  });
  await expect.poll(() => page.evaluate(() => {
    const rival=window.__lovecDebug.rivalSnapshot();
    return rival ? {moving:rival.moving,motionRatio:rival.motionRatio} : null;
  })).toEqual({moving:false,motionRatio:0});

  const rivalSource = await page.evaluate(async () => {
    const source=await (await fetch("./game.js")).text();
    return source.slice(source.indexOf("function updateRival"),source.indexOf("function updateParticles"));
  });
  expect(rivalSource).toContain("updateHumanoidMotionState(r");
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

test("starší Malše save bez certifikační položky se migruje bez softlocku", async ({ page }) => {
  await openDebug(page);
  await page.evaluate(() => {
    localStorage.clear();
    window.__lovecDebug.startLevel(4);
    window.__lovecDebug.setPlayer(720,1060);
    window.__lovecDebug.setScanCooldown(0);
  });
  await page.keyboard.press("Space");

  await page.evaluate(saveKey => {
    const save=JSON.parse(localStorage.getItem(saveKey));
    delete save.world.runtime.certificateRecovered;
    save.world.runtime.registered=false;
    save.world.runtime.papers=0;
    save.world.runtime.bossStarted=false;
    save.world.runtime.bossDefeated=false;
    save.world.items=save.world.items.filter(item=>item.special!=="certificate");
    localStorage.setItem(saveKey,JSON.stringify(save));
  }, SAVE_KEY);

  await page.reload({waitUntil:"domcontentloaded"});
  await page.locator("#continueButton").click();
  await page.locator("#briefButton").click();
  await expect(page.locator("#objectiveLabel")).toHaveText("Najdi složku s certifikáty");

  const migrated = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
  const certificate = migrated.world.items.find(item=>item.special==="certificate");
  expect(certificate).toMatchObject({type:"paper",active:true,hidden:true});

  await recoverMalseCertificates(page);
  await expect(page.locator("#objectiveLabel")).toHaveText("Zaregistruj sbírku u vstupu");
});

test("legacy Malše save s bossDelay se převede na novou kontrolu podvodu", async ({ page }) => {
  const errors = watchErrors(page);
  await openDebug(page);
  await page.evaluate(() => window.__lovecDebug.startLevel(4));
  await recoverMalseCertificates(page);
  await page.evaluate(() => window.__lovecDebug.setPlayer(1450,250));
  await page.keyboard.press("Space");
  await page.locator("#dialogButton").click();

  await page.evaluate(saveKey => {
    const save=JSON.parse(localStorage.getItem(saveKey));
    save.world.runtime={papers:3,bossStarted:false,bossDefeated:false,bossDelay:.45};
    delete save.state.stats.filled;delete save.state.stats.fraud;delete save.state.stats.dossier;
    localStorage.setItem(saveKey,JSON.stringify(save));
  }, SAVE_KEY);
  await page.reload({waitUntil:"domcontentloaded"});
  await page.locator("#continueButton").click();
  await expect(page.locator("#briefScreen")).toHaveClass(/visible/);
  await page.locator("#briefButton").click();

  await expect.poll(() => page.evaluate(() => window.__lovecDebug.malseSnapshot())).toMatchObject({
    registered:true,papers:3,fraudResolved:false,bossStarted:false,bossDefeated:false
  });
  await expect(page.locator("#objectiveLabel")).toHaveText("Prověř Frantův vzorek u vstupu");
  await page.waitForTimeout(700);
  expect(await page.evaluate(() => window.__lovecDebug.snapshot().boss)).toBeNull();
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

test("strukturálně poškozený snapshot světa se zahodí a lokalita se bezpečně obnoví", async ({ page }) => {
  const errors = watchErrors(page);
  await openDebug(page);
  await page.evaluate(saveKey => {
    localStorage.clear();
    window.__lovecDebug.startLevel(2);
    window.__lovecDebug.completeGoal();
    const save=JSON.parse(localStorage.getItem(saveKey));
    save.world.runtime=null;
    delete save.world.hotspots;
    delete save.world.patrols;
    localStorage.setItem(saveKey,JSON.stringify(save));
  }, SAVE_KEY);

  await page.reload({waitUntil:"domcontentloaded"});
  await page.locator("#continueButton").click();
  await expect(page.locator("#briefKicker")).toHaveText("LOKALITA 3 / 5");
  await page.locator("#briefButton").click();

  await expect(page.locator("#objectiveLabel")).toHaveText("Získej souhlas lesníka");
  const restored=await page.evaluate(key => ({
    snapshot:window.__lovecDebug.snapshot(),
    save:JSON.parse(localStorage.getItem(key))
  }), SAVE_KEY);
  expect(restored.snapshot).toMatchObject({level:"nesmen",mode:"playing"});
  expect(restored.save.world.runtime).toMatchObject({permit:false,dug:0,filled:0,open:0});
  for(const key of ["items","props","obstacles","hotspots","patrols","hazards","particles","radarPings"]){
    expect(Array.isArray(restored.save.world[key]),key).toBe(true);
  }
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

test("dopadení se uloží okamžitě včetně ztraceného kamene a návratové pozice", async ({ page }) => {
  await openDebug(page);
  await page.evaluate(() => {
    localStorage.clear();
    window.__lovecDebug.startLevel(0);
    window.__lovecDebug.completeGoal();
  });

  const penalty = await page.evaluate(() => window.__lovecDebug.triggerCaught("Kontrola save"));
  expect(penalty.caught).toBe(1);
  expect(penalty.stones).toBe(5);
  expect(penalty.player).toEqual({x:360,y:1070});

  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
  expect(saved.state.caught).toBe(1);
  expect(saved.state.stones).toHaveLength(5);
  expect(saved.player).toMatchObject({x:360,y:1070});

  await page.reload({waitUntil:"domcontentloaded"});
  await page.locator("#continueButton").click();
  await page.locator("#briefButton").click();
  const restored = await page.evaluate(() => window.__lovecDebug.snapshot());
  expect(restored.state).toMatchObject({caught:1,stones:5});
  expect(restored.player).toMatchObject({x:360,y:1070});
});

test("neúspěšné kopání uloží důsledky před návratem do hry", async ({ page }) => {
  await openDebug(page);
  await page.evaluate(() => {
    localStorage.clear();
    window.__lovecDebug.startDigChallenge(2);
    window.__lovecDebug.setDigTime(0);
  });
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.snapshot().mode)).toBe("playing");
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
  expect(saved.state.heat).toBeGreaterThanOrEqual(4);

  await page.reload({waitUntil:"domcontentloaded"});
  await page.locator("#continueButton").click();
  await expect(page.locator("#briefScreen")).toHaveClass(/visible/);
  expect(await page.evaluate(() => window.__lovecDebug.snapshot().heat)).toBe(saved.state.heat);
  await page.locator("#briefButton").click();
});

test("souhlas lesníka v Nesměni přežije reload před prvním kopáním", async ({ page }) => {
  await openDebug(page);
  await page.evaluate(() => {
    localStorage.clear();
    window.__lovecDebug.startLevel(2);
    window.__lovecDebug.setPlayer(290,980);
  });
  await page.keyboard.press("Space");
  await expect(page.locator("#dialogScreen")).toHaveClass(/visible/);
  await page.locator("#dialogButton").click();
  await expect(page.locator("#objectiveLabel")).toHaveText("Profily 0/3 · zahrabáno 0/3");

  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
  expect(saved.world.runtime.permit).toBe(true);

  await page.reload({waitUntil:"domcontentloaded"});
  await page.locator("#continueButton").click();
  await page.locator("#briefButton").click();
  await expect(page.locator("#objectiveLabel")).toHaveText("Profily 0/3 · zahrabáno 0/3");
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).world.runtime.permit, SAVE_KEY)).toBe(true);
});

test("radarem odhalený nález zůstane odhalený po reloadu i bez sebrání", async ({ page }) => {
  await openDebug(page);
  await page.evaluate(() => {
    localStorage.clear();
    window.__lovecDebug.startLevel(0);
    window.__lovecDebug.setPlayer(500,840);
    window.__lovecDebug.setScanCooldown(0);
  });
  await page.keyboard.press("Space");
  await expect(page.locator("#actionText")).toHaveText("SEBRAT");

  const before = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
  const revealed = before.world.items.find(item => item.type==="stone" && item.x===500 && item.y===840);
  expect(revealed?.hidden).toBe(false);

  await page.reload({waitUntil:"domcontentloaded"});
  await page.locator("#continueButton").click();
  await page.locator("#briefButton").click();
  await page.evaluate(() => window.__lovecDebug.setPlayer(500,840));
  await expect(page.locator("#actionText")).toHaveText("SEBRAT");
});

test("čekající Karel se po reloadu znovu spustí místo softlocku Besednice", async ({ page }) => {
  await openDebug(page);
  await page.evaluate(saveKey => {
    localStorage.clear();
    window.__lovecDebug.startLevel(3);
    window.__lovecDebug.completeGoal();
    const save=JSON.parse(localStorage.getItem(saveKey));
    save.state.stones=save.state.stones.filter(stone=>stone.rarity!=="hedgehog");
    save.world.runtime.hedgehog=true;
    save.world.runtime.chaseStarted=true;
    save.world.runtime.bossStarted=false;
    save.world.runtime.bossDefeated=false;
    save.world.runtime.pendingBoss={x:1100,y:430};
    delete save.world.rival;
    localStorage.setItem(saveKey,JSON.stringify(save));
  }, SAVE_KEY);

  await page.reload({waitUntil:"domcontentloaded"});
  await page.locator("#continueButton").click();
  await page.locator("#briefButton").click();

  await expect.poll(() => page.evaluate(() => window.__lovecDebug.snapshot().boss)).toMatchObject({
    name:"karel",active:true,hits:0,maxHits:3
  });
  await expect(page.locator("#objectiveLabel")).toHaveText("Získej ježka zpět");
  const restored = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
  expect(restored.world.runtime.bossStarted).toBe(true);
  expect(restored.world.runtime.pendingBoss ?? null).toBeNull();
});

test("rozběhnutá Karlova honička bez rival objektu se po reloadu sama obnoví", async ({ page }) => {
  await openDebug(page);
  await page.evaluate(saveKey => {
    localStorage.clear();
    window.__lovecDebug.startLevel(3);
    window.__lovecDebug.completeGoal();
    const save=JSON.parse(localStorage.getItem(saveKey));
    save.state.stones=save.state.stones.filter(stone=>stone.rarity!=="hedgehog");
    save.world.runtime.hedgehog=true;
    save.world.runtime.chaseStarted=true;
    save.world.runtime.bossStarted=true;
    save.world.runtime.bossDefeated=false;
    delete save.world.runtime.pendingBoss;
    delete save.world.rival;
    localStorage.setItem(saveKey,JSON.stringify(save));
  }, SAVE_KEY);

  await page.reload({waitUntil:"domcontentloaded"});
  await page.locator("#continueButton").click();
  await page.locator("#briefButton").click();

  await expect.poll(() => page.evaluate(() => window.__lovecDebug.snapshot().boss)).toMatchObject({
    name:"karel",active:true,hits:0,maxHits:3
  });
  await expect(page.locator("#objectiveLabel")).toHaveText("Získej ježka zpět");
});

test("rozběhnutý Frantův útěk bez rival objektu se po reloadu sám obnoví", async ({ page }) => {
  await openDebug(page);
  await page.evaluate(saveKey => {
    localStorage.clear();
    window.__lovecDebug.startLevel(4);
    window.__lovecDebug.completeGoal();
    const save=JSON.parse(localStorage.getItem(saveKey));
    save.world.runtime.certificateRecovered=true;
    save.world.runtime.registered=true;
    save.world.runtime.papers=3;
    save.world.runtime.fraudResolved=true;
    save.world.runtime.bossStarted=true;
    save.world.runtime.bossDefeated=false;
    save.world.runtime.dossierRecovered=false;
    save.world.runtime.frantaEscaped=false;
    delete save.world.rival;
    localStorage.setItem(saveKey,JSON.stringify(save));
  }, SAVE_KEY);

  await page.reload({waitUntil:"domcontentloaded"});
  await page.locator("#continueButton").click();
  await page.locator("#briefButton").click();

  await expect.poll(() => page.evaluate(() => window.__lovecDebug.snapshot().boss)).toMatchObject({
    name:"franta",active:true,hits:0,maxHits:1
  });
  await expect(page.locator("#objectiveLabel")).toHaveText("Dostihni Frantu a vezmi složku zpět");
});

test("každý platný zásah Karla se checkpointuje a finální ježek přežije reload", async ({ page }) => {
  await openDebug(page);
  await page.evaluate(() => {
    localStorage.clear();
    window.__lovecDebug.startLevel(3);
    window.__lovecDebug.spawnBoss("karel");
    window.__lovecDebug.setBossStun(1);
    window.__lovecDebug.hitBoss();
  });

  let saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
  expect(saved.world.rival.hits).toBe(1);
  expect(saved.world.runtime.bossStarted).toBe(true);
  expect(saved.world.runtime.bossDefeated).toBe(false);

  for(let hit=2;hit<=3;hit+=1){
    await page.evaluate(() => {
      window.__lovecDebug.setBossStun(1);
      window.__lovecDebug.hitBoss();
    });
  }
  saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
  expect(saved.world.runtime.bossDefeated).toBe(true);
  expect(saved.world.rival.active).toBe(false);
  expect(saved.state.stones.some(stone=>stone.rarity==="hedgehog")).toBe(true);

  await page.reload({waitUntil:"domcontentloaded"});
  await page.locator("#continueButton").click();
  await page.locator("#briefButton").click();
  await expect(page.locator("#objectiveLabel")).toHaveText("Ježek je v bezpečí");
});

test("perk a porota se po reloadu obnoví bez opakovaného bodového bonusu", async ({ page }) => {
  await openDebug(page);
  await page.evaluate(() => {
    localStorage.clear();
    window.__lovecDebug.startLevel(0);
    window.__lovecDebug.completeGoal();
    window.__lovecDebug.exitCurrentLevel();
  });
  await expect(page.locator("#perkScreen")).toHaveClass(/visible/);
  const perkSave = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
  expect(perkSave.state.pendingTransition).toBe("perk");
  expect(perkSave.state.pendingPerks).toHaveLength(3);
  const perkScore = perkSave.state.score;
  const perkOffer = [...perkSave.state.pendingPerks];

  await page.reload({waitUntil:"domcontentloaded"});
  await page.locator("#continueButton").click();
  await expect(page.locator("#perkScreen")).toHaveClass(/visible/);
  const restoredPerkSave = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
  expect(restoredPerkSave.state.score).toBe(perkScore);
  expect(restoredPerkSave.state.pendingPerks).toEqual(perkOffer);
  await page.locator(".perk-option").first().click();
  await expect(page.locator("#briefKicker")).toHaveText("LOKALITA 2 / 5");
  const advanced = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
  expect(advanced.state).toMatchObject({levelIndex:1,pendingTransition:null,pendingPerks:[]});

  await page.evaluate(() => {
    window.__lovecDebug.startLevel(3);
    window.__lovecDebug.completeGoal();
    window.__lovecDebug.exitCurrentLevel();
  });
  await expect(page.locator("#perkScreen")).toHaveClass(/visible/);
  await page.locator(".perk-option").first().click();
  await expect(page.locator("#expertiseScreen")).toHaveClass(/visible/);
  await expect(page.locator("#expertiseTitle")).toBeFocused();
  const expertiseSave = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
  expect(expertiseSave.state).toMatchObject({levelIndex:4,pendingTransition:"expertise",pendingPerks:[]});
  const expertiseScore = expertiseSave.state.score;

  await page.reload({waitUntil:"domcontentloaded"});
  await page.locator("#continueButton").click();
  await expect(page.locator("#expertiseScreen")).toHaveClass(/visible/);
  expect((await page.evaluate(key => JSON.parse(localStorage.getItem(key)).state.score, SAVE_KEY))).toBe(expertiseScore);
  await page.locator("#expertiseButton").click();
  await expect(page.locator("#briefKicker")).toHaveText("LOKALITA 5 / 5");
  const afterExpertise = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
  expect(afterExpertise.state).toMatchObject({levelIndex:4,pendingTransition:null,pendingPerks:[]});

  await page.evaluate(() => {
    window.__lovecDebug.startLevel(3);
    window.__lovecDebug.completeGoal();
    window.__lovecDebug.exitCurrentLevel();
  });
  await expect(page.locator("#perkScreen")).toHaveClass(/visible/);
  await page.locator(".perk-option").first().click();
  await expect(page.locator("#expertiseScreen")).toHaveClass(/visible/);
  await expect(page.locator("#expertiseScreen")).not.toHaveAttribute("role","dialog");
  await expect(page.locator("#expertiseScreen")).not.toHaveAttribute("aria-modal","true");
  await expect(page.locator("#expertiseTitle")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator("#expertiseScreen")).toHaveClass(/visible/);
  await page.locator("#expertiseButton").click();
  await expect(page.locator("#briefKicker")).toHaveText("LOKALITA 5 / 5");

  await page.evaluate(() => {
    window.__lovecDebug.startLevel(4);
    window.__lovecDebug.completeGoal();
    window.__lovecDebug.exitCurrentLevel();
  });
  await expect(page.locator("#juryScreen")).toHaveClass(/visible/);
  const jurySave = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
  expect(jurySave.state.pendingTransition).toBe("jury");
  const juryScore = jurySave.state.score;

  await page.reload({waitUntil:"domcontentloaded"});
  await page.locator("#continueButton").click();
  await expect(page.locator("#juryScreen")).toHaveClass(/visible/);
  expect((await page.evaluate(key => JSON.parse(localStorage.getItem(key)).state.score, SAVE_KEY))).toBe(juryScore);
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
      if (index === 3) {
        await expect(page.locator("#expertiseScreen")).toHaveClass(/visible/);
        await expect(page.locator("#expertiseText")).toContainText("vystaví k nim certifikáty");
        await page.locator("#expertiseButton").click();
      }
      await expect(page.locator("#briefScreen")).toHaveClass(/visible/);
    }
  }

  await expect(page.locator("#juryScreen")).toHaveClass(/visible/);
  await expect(page.locator("#juryCount")).toHaveText("0 / 3");

  const stones = page.locator("#juryList .stone-card");
  expect(await stones.count()).toBeGreaterThanOrEqual(3);
  await expect(stones.first().locator("small")).toHaveText(/stav: .+ · \d+ % · původ (doložený|nedoložený)/);
  for (let index = 0; index < 3; index += 1) await stones.nth(index).click();

  await expect(page.locator("#juryCount")).toHaveText("3 / 3");
  await expect(page.locator("#juryButton")).toBeEnabled();
  await page.locator("#juryButton").click();
  await expect(page.locator("#juryDescription")).toHaveText("Vitrína je připravená. Porota přichází.");
  await expect(page.locator("#juryButton")).toHaveText("POROTA PŘICHÁZÍ");

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
  await expect(page.locator("#theftAlert strong")).toHaveText("KAREL TI VZAL JEŽKA");

  await page.keyboard.down("KeyD");
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.snapshot().input)).toEqual({ x: 0, y: 0, pressed: false });
  await page.keyboard.up("KeyD");
  await expect.poll(
    () => page.evaluate(() => window.__lovecDebug.snapshot().theftAlertShown),
    { timeout: 5_000 }
  ).toBe(false);
  await expect(page.locator("#bossIntroText")).toHaveText("Karel ti sebral ježka a utíká. Po sprintu se na chvíli zastaví — tehdy ho chyť.");

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
  const realTitles = new Set(["Olivová kapka", "Hnědozelená kapka", "Drobný celotvar"]);

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

    await expect(page.locator("#digScreen")).toHaveClass(/visible/);
    await expect(page.locator("#digTitle")).toHaveText("Zahrabání díry");
    await expect(page.locator("#digButton")).toHaveText("DRŽ A PUSŤ");
    await expect.poll(() => page.evaluate(() => window.__lovecDebug.digSnapshot().kind)).toBe("fill");

    for (let transfer = 1; transfer <= 3; transfer += 1) {
      await page.evaluate(() => window.__lovecDebug.setDigSpeed(0));
      await page.keyboard.down("Space");
      await expect.poll(() => page.evaluate(() => window.__lovecDebug.digSnapshot().holding)).toBe(true);
      await expect.poll(() => page.evaluate(() => window.__lovecDebug.digSnapshot().hits)).toBe(transfer - 1);
      await page.evaluate(() => {
        const snapshot = window.__lovecDebug.digSnapshot();
        window.__lovecDebug.setDigMarker(snapshot.zoneCenter);
      });
      await expect.poll(() => page.evaluate(() => window.__lovecDebug.digSnapshot().hits)).toBe(transfer - 1);
      await page.keyboard.up("Space");

      if (transfer < 3) {
        await expect.poll(() => page.evaluate(() => window.__lovecDebug.digSnapshot().hits)).toBe(transfer);
        await expect.poll(() => page.evaluate(() => window.__lovecDebug.digSnapshot().holding)).toBe(false);
      }
    }

    await expect.poll(() => page.evaluate(() => window.__lovecDebug.snapshot().mode)).toBe("playing");
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

test("Malše projdou registrací, kontrolou podvodu, jedním zachycením Franty a vitrínou", async ({ page }) => {
  const errors = watchErrors(page);
  const evidence = [
    { x: 760, y: 860, objective: "Indicie 1/3" },
    { x: 1040, y: 560, objective: "Indicie 2/3" },
    { x: 1280, y: 360, objective: "Prověř Frantův vzorek u vstupu" }
  ];

  await openDebug(page);
  await page.evaluate(() => window.__lovecDebug.startLevel(4));
  await expect(page.locator("#objectiveLabel")).toHaveText("Najdi složku s certifikáty");

  await page.evaluate(() => window.__lovecDebug.setPlayer(1450, 250));
  await expect(page.locator("#actionText")).toHaveText("NAJDI SLOŽKU");
  await page.keyboard.press("Space");
  await expect(page.locator("#objectiveLabel")).toHaveText("Najdi složku s certifikáty");

  await recoverMalseCertificates(page);
  await expect(page.locator("#objectiveLabel")).toHaveText("Zaregistruj sbírku u vstupu");

  await page.evaluate(() => window.__lovecDebug.setPlayer(1450, 250));
  await expect(page.locator("#actionText")).toHaveText("REGISTROVAT");
  await page.keyboard.press("Space");
  await expect(page.locator("#dialogScreen")).toHaveClass(/visible/);
  await expect(page.locator("#dialogName")).toHaveText("POŘADATEL");
  await page.locator("#dialogButton").click();
  await expect(page.locator("#objectiveLabel")).toHaveText("Indicie 0/3");

  for (const item of evidence) {
    await page.evaluate(({ x, y }) => window.__lovecDebug.setPlayer(x, y), item);
    await expect(page.locator("#actionText")).toHaveText("PROVĚŘIT");
    await page.keyboard.press("Space");
    await expect(page.locator("#objectiveLabel")).toHaveText(item.objective);
  }

  await page.evaluate(() => window.__lovecDebug.setPlayer(1450, 250));
  await expect(page.locator("#actionText")).toHaveText("KONTROLA");
  await page.keyboard.press("Space");
  await expect(page.locator("#fraudScreen")).toHaveClass(/visible/);
  await expect(page.locator("#fraudButton")).toBeFocused();

  await page.locator("#fraudWrongButton").click();
  await expect(page.locator("#fraudFeedback")).toHaveClass(/bad/);
  await expect(page.locator("#fraudFeedback")).toContainText("Posuď všechny tři nesrovnalosti společně");
  await page.keyboard.press("Escape");
  await expect(page.locator("#fraudScreen")).toHaveClass(/visible/);

  await page.locator("#fraudButton").click();
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.snapshot().boss)).toMatchObject({ name: "franta", active: true, maxHits: 1 });
  await expect(page.locator("#objectiveLabel")).toHaveText("Dostihni Frantu a vezmi složku zpět");
  await expect(page.locator("#bossPhase")).toContainText(/BERE SLOŽKU|DOSTIHNI HO/);

  await page.evaluate(() => {
    const player = window.__lovecDebug.snapshot().player;
    window.__lovecDebug.setBossPose(player.x + 35, player.y, 0);
  });
  await expect(page.locator("#actionText")).toHaveText("ZASTAVIT");
  await page.keyboard.press("Space");
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.snapshot().boss)).toMatchObject({ name: "franta", active: false, hits: 1, maxHits: 1 });
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.malseSnapshot())).toMatchObject({ bossDefeated: true, dossierRecovered: true, frantaEscaped: false });
  await expect(page.locator("#objectiveLabel")).toHaveText("Vstup do výstavního sálu");

  await page.evaluate(() => window.__lovecDebug.setPlayer(1450, 250));
  await expect(page.locator("#actionText")).toHaveText("VSTOUPIT");
  await page.keyboard.press("Space");
  await expect(page.locator("#juryScreen")).toHaveClass(/visible/);
  await expect(page.locator(".exhibition-hall")).toBeVisible();
  expect(errors).toEqual([]);
});

test("Slávie nemá cyklisty ani policii a Frantu lze chytit přímo akčním tlačítkem", async ({ page }, testInfo) => {
  await openDebug(page);
  await page.evaluate(() => {
    localStorage.clear();
    window.__lovecDebug.startLevel(4);
  });

  expect((await page.evaluate(() => window.__lovecDebug.patrolSnapshot().map(p => p.type)))).not.toContain("bike");
  expect((await page.evaluate(() => window.__lovecDebug.patrolSnapshot().map(p => p.type)))).not.toContain("police");

  await page.evaluate(() => {
    window.__lovecDebug.completeGoal();
    window.__lovecDebug.spawnBoss("franta");
    const player = window.__lovecDebug.snapshot().player;
    window.__lovecDebug.setBossPose(player.x + 125, player.y, 0);
  });
  await expect(page.locator("#actionText")).toHaveText("ZASTAVIT");
  const actionButton=page.locator("#actionButton");
  if(testInfo.project.name.includes("iphone")){
    await expect(actionButton).toBeVisible();
    await actionButton.tap();
  }else{
    await page.keyboard.press("Space");
  }
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.snapshot().boss)).toMatchObject({
    name:"franta",active:false,hits:1,maxHits:1
  });
});

test("starší Slávie save při načtení odstraní cyklisty a policii", async ({ page }) => {
  await openDebug(page);
  await page.evaluate(saveKey => {
    localStorage.clear();
    window.__lovecDebug.startLevel(4);
    window.__lovecDebug.completeGoal();
    const save=JSON.parse(localStorage.getItem(saveKey));
    save.world.patrols.push(
      {type:"bike",x:620,y:820,points:[{x:620,y:820},{x:620,y:180}],index:1,speed:155,active:true},
      {type:"police",x:1180,y:980,points:[{x:1180,y:980},{x:1220,y:260}],index:1,speed:92,vision:190,active:true}
    );
    localStorage.setItem(saveKey,JSON.stringify(save));
  }, SAVE_KEY);

  await page.reload({waitUntil:"domcontentloaded"});
  await page.locator("#continueButton").click();
  await page.locator("#briefButton").click();
  const types=await page.evaluate(() => window.__lovecDebug.patrolSnapshot().map(p => p.type));
  expect(types).not.toContain("bike");
  expect(types).not.toContain("police");
});

test("Malše zůstane dohratelná, když Franta se složkou unikne", async ({ page }) => {
  const errors = watchErrors(page);
  await openDebug(page);
  const escaped = await page.evaluate(() => {
    window.__lovecDebug.startLevel(4);
    window.__lovecDebug.completeGoal();
    window.__lovecDebug.spawnBoss("franta");
    return window.__lovecDebug.forceFrantaEscape();
  });
  expect(escaped).toMatchObject({ active: false, bossDefeated: true, dossierRecovered: false, frantaEscaped: true });
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.malseSnapshot())).toMatchObject({
    bossDefeated: true, dossierRecovered: false, frantaEscaped: true
  });
  await page.evaluate(() => window.__lovecDebug.setPlayer(1450, 250));
  await expect(page.locator("#objectiveLabel")).toContainText("kopie záznamů");
  await page.keyboard.press("Space");
  await expect(page.locator("#juryScreen")).toHaveClass(/visible/);
  expect(errors).toEqual([]);
});

test("finále lze dokončit i s prázdnou sbírkou", async ({ page }) => {
  await openDebug(page);
  await page.evaluate(() => { window.__lovecDebug.startLevel(4); window.__lovecDebug.completeGoal(); window.__lovecDebug.exitCurrentLevel(); });
  await expect(page.locator("#juryScreen")).toHaveClass(/visible/);
  await expect(page.locator("#juryCount")).toHaveText("0 / 0");
  await expect(page.locator("#juryButton")).toBeEnabled();
  await expect(page.locator("#juryDescription")).toContainText("prázdná");
  await page.locator("#juryButton").click();
  await expect(page.locator("#juryDescription")).toHaveText("Vitrína je připravená. Porota přichází.");
  await expect(page.locator("#resultScreen")).toHaveClass(/visible/);
  await expect(page.locator("#resultScore")).not.toHaveText("0");
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


test("skutečné modály mají názvy, modalitu a skryté obrazovky jsou inertní", async ({ page }) => {
  await page.goto("/");
  const modalIds = ["digScreen","identifyScreen","dialogScreen","fraudScreen","pauseScreen","howScreen","recordsScreen"];
  for (const id of modalIds) {
    const attrs = await page.locator(`#${id}`).evaluate(element => ({
      role: element.getAttribute("role"),
      modal: element.getAttribute("aria-modal"),
      labelledby: element.getAttribute("aria-labelledby"),
      describedby: element.getAttribute("aria-describedby"),
      inert: element.hasAttribute("inert"),
      hidden: element.getAttribute("aria-hidden")
    }));
    expect(attrs.role, id).toBe("dialog");
    expect(attrs.modal, id).toBe("true");
    expect(attrs.labelledby, id).toBeTruthy();
    expect(attrs.inert, id).toBe(true);
    expect(attrs.hidden, id).toBe("true");
    const label = await page.locator(`#${id}`).getAttribute("aria-labelledby");
    await expect(page.locator(`#${label}`), `${id} label`).toHaveCount(1);
    if (attrs.describedby) await expect(page.locator(`#${attrs.describedby}`), `${id} description`).toHaveCount(1);
  }

  for (const id of ["briefScreen","perkScreen","expertiseScreen","juryScreen","resultScreen"]) {
    await expect(page.locator(`#${id}`), `${id} is a standalone flow screen`).not.toHaveAttribute("role","dialog");
    await expect(page.locator(`#${id}`)).not.toHaveAttribute("aria-modal","true");
    await expect(page.locator(`#${id}`)).toHaveAttribute("aria-labelledby",/.+/);
    await expect(page.locator(`#${id}`)).toHaveAttribute("inert","");
    await expect(page.locator(`#${id}`)).toHaveAttribute("aria-hidden","true");
  }

  await expect(page.locator("#titleScreen")).not.toHaveAttribute("role","dialog");
  await expect(page.locator("#theftAlert")).toHaveAttribute("role","alert");
  await expect(page.locator("#bossIntro")).toHaveAttribute("role","status");
});

test("briefing je samostatná obrazovka a po přechodu oznámí svůj nadpis", async ({ page }) => {
  await page.goto("/");
  await page.locator("#playButton").click();
  await expect(page.locator("#briefScreen")).toHaveClass(/visible/);
  await expect(page.locator("#briefScreen")).not.toHaveAttribute("aria-modal","true");
  await expect(page.locator("#briefTitle")).toBeFocused();
});

test("perk, expertiza a porota jsou povinné samostatné kroky, které Escape neobejde", async ({ page }) => {
  await openDebug(page);
  await page.evaluate(() => {
    window.__lovecDebug.startLevel(0);
    window.__lovecDebug.completeGoal();
    window.__lovecDebug.exitCurrentLevel();
  });
  await expect(page.locator("#perkScreen")).toHaveClass(/visible/);
  await expect(page.locator("#perkScreen")).not.toHaveAttribute("role","dialog");
  await expect(page.locator("#perkScreen")).not.toHaveAttribute("aria-modal","true");
  await expect(page.locator("#perkTitle")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator("#perkScreen")).toHaveClass(/visible/);

  await page.evaluate(() => {
    window.__lovecDebug.startLevel(4);
    window.__lovecDebug.completeGoal();
    window.__lovecDebug.exitCurrentLevel();
  });
  await expect(page.locator("#juryScreen")).toHaveClass(/visible/);
  await expect(page.locator("#juryScreen")).not.toHaveAttribute("role","dialog");
  await expect(page.locator("#juryScreen")).not.toHaveAttribute("aria-modal","true");
  await expect(page.locator("#juryTitle")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator("#juryScreen")).toHaveClass(/visible/);
});

test("povinné určení vzorku nejde obejít Escape", async ({ page }) => {
  await openDebug(page);
  await page.evaluate(() => {
    window.__lovecDebug.startLevel(1);
    window.__lovecDebug.setPlayer(420,850);
    window.__lovecDebug.setScanCooldown(0);
  });
  await page.keyboard.press("Space");
  await page.waitForTimeout(40);
  await page.keyboard.press("Space");
  await expect(page.locator("#identifyScreen")).toHaveClass(/visible/);
  await page.keyboard.press("Escape");
  await expect(page.locator("#identifyScreen")).toHaveClass(/visible/);
  await expect(page.locator("#realButton")).toBeFocused();
});

test("fokus se přesune do modálu, zůstane uvnitř a vrátí se na spouštěč", async ({ page }) => {
  await page.goto("/");
  await page.locator("#howButton").focus();
  await page.locator("#howButton").click();
  await expect(page.locator("#howScreen")).toHaveClass(/visible/);
  await expect(page.locator("#closeHowButton")).toBeFocused();

  await page.keyboard.press("Tab");
  await expect(page.locator("#closeHowButton")).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.locator("#closeHowButton")).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(page.locator("#titleScreen")).toHaveClass(/visible/);
  await expect(page.locator("#howButton")).toBeFocused();

  await page.locator("#recordsButton").click();
  await expect(page.locator("#closeRecordsButton")).toBeFocused();
  await page.locator("#closeRecordsButton").click();
  await expect(page.locator("#recordsButton")).toBeFocused();
});

test("Escape bezpečně pauzne a obnoví gameplay i kopání s návratem fokusu", async ({ page }) => {
  await openDebug(page);
  await page.evaluate(() => window.__lovecDebug.startLevel(0));
  await page.locator("#game").focus();
  await page.keyboard.press("Escape");
  await expect(page.locator("#pauseScreen")).toHaveClass(/visible/);
  await expect(page.locator("#resumeButton")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.snapshot().mode)).toBe("playing");
  await expect(page.locator("#game")).toBeFocused();

  await page.evaluate(() => window.__lovecDebug.startDigChallenge());
  await page.locator("#digButton").focus();
  await page.keyboard.press("Escape");
  await expect(page.locator("#pauseScreen")).toHaveClass(/visible/);
  await page.keyboard.press("Escape");
  await expect(page.locator("#digScreen")).toHaveClass(/visible/);
  await expect(page.locator("#digButton")).toBeFocused();
});

test("skryté herní ovládání nelze zaměřit během modálu", async ({ page }) => {
  await openDebug(page);
  await page.evaluate(() => window.__lovecDebug.startLevel(0));
  await page.keyboard.press("Escape");
  await expect(page.locator("#pauseScreen")).toHaveClass(/visible/);
  await page.locator("#actionButton").focus();
  expect(await page.evaluate(() => document.activeElement?.id)).not.toBe("actionButton");
  await page.locator("#pauseButton").focus();
  expect(await page.evaluate(() => document.activeElement?.id)).not.toBe("pauseButton");
  await expect(page.locator("#controls")).toHaveAttribute("inert","");
  await expect(page.locator("#app")).not.toHaveAttribute("inert","");
  await expect(page.locator("#app")).not.toHaveAttribute("aria-hidden","true");
});

test("joystick drží jediný pointer a pointercancel vždy uvolní pohyb", async ({ page }) => {
  await openDebug(page);
  await page.evaluate(() => window.__lovecDebug.startLevel(0));
  await page.locator("#moveZone").evaluate(zone => {
    Object.defineProperty(zone,"getBoundingClientRect",{configurable:true,value:()=>({left:0,top:0,right:128,bottom:128,width:128,height:128,x:0,y:0,toJSON(){return this;}})});
  });
  await page.locator("#moveZone").dispatchEvent("pointerdown",{pointerId:41,pointerType:"touch",clientX:20,clientY:20,bubbles:true,cancelable:true});
  await page.locator("#moveZone").dispatchEvent("pointermove",{pointerId:41,pointerType:"touch",clientX:90,clientY:40,bubbles:true,cancelable:true});
  const moving = await page.evaluate(() => window.__lovecDebug.snapshot().input);
  expect(Math.abs(moving.x)+Math.abs(moving.y)).toBeGreaterThan(0);

  await page.locator("#moveZone").dispatchEvent("pointerdown",{pointerId:42,pointerType:"touch",clientX:70,clientY:70,bubbles:true,cancelable:true});
  await page.locator("#moveZone").dispatchEvent("pointercancel",{pointerId:42,pointerType:"touch",bubbles:true,cancelable:true});
  const stillMoving = await page.evaluate(() => window.__lovecDebug.snapshot().input);
  expect(Math.abs(stillMoving.x)+Math.abs(stillMoving.y)).toBeGreaterThan(0);

  await page.locator("#moveZone").dispatchEvent("pointercancel",{pointerId:41,pointerType:"touch",bubbles:true,cancelable:true});
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.snapshot().input)).toEqual({x:0,y:0,pressed:false});
});

test("akční tlačítko drží jediný pointer a lifecycle reset ho vždy uvolní", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.startsWith("desktop-"),"Dotykové akční tlačítko je v desktop fine-pointer layoutu záměrně skryté.");
  await openDebug(page);
  await page.evaluate(() => window.__lovecDebug.startScaleReference());
  const button = page.locator("#actionButton");

  await button.dispatchEvent("pointerdown",{pointerId:51,pointerType:"touch",bubbles:true,cancelable:true});
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.snapshot().input.pressed)).toBe(true);

  await button.dispatchEvent("pointerdown",{pointerId:52,pointerType:"touch",bubbles:true,cancelable:true});
  await button.dispatchEvent("pointercancel",{pointerId:52,pointerType:"touch",bubbles:true,cancelable:true});
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.snapshot().input.pressed)).toBe(true);

  await button.dispatchEvent("lostpointercapture",{pointerId:51,pointerType:"touch",bubbles:true});
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.snapshot().input.pressed)).toBe(false);
  await expect(button).not.toHaveClass(/active/);

  await button.dispatchEvent("pointerdown",{pointerId:53,pointerType:"touch",bubbles:true,cancelable:true});
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.snapshot().input.pressed)).toBe(true);
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.snapshot().input.pressed)).toBe(false);
  await expect(button).not.toHaveClass(/active/);
});
test("kopací tlačítko po ztrátě capture, blur, pagehide a změně orientace nezůstane zamčené", async ({ page }) => {
  await openDebug(page);
  await page.evaluate(() => window.__lovecDebug.startFillChallenge());
  const button = page.locator("#digButton");

  await button.dispatchEvent("pointerdown",{pointerId:61,pointerType:"touch",bubbles:true,cancelable:true});
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.digSnapshot().holding)).toBe(true);
  await button.dispatchEvent("lostpointercapture",{pointerId:61,pointerType:"touch",bubbles:true});
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.digSnapshot().holding)).toBe(false);
  await expect(button).not.toHaveClass(/pressed/);

  let pointerId=62;
  for (const lifecycleEvent of ["blur","pagehide","orientationchange"]) {
    await button.dispatchEvent("pointerdown",{pointerId,pointerType:"touch",bubbles:true,cancelable:true});
    await expect.poll(() => page.evaluate(() => window.__lovecDebug.digSnapshot().holding)).toBe(true);
    await expect(button).toHaveClass(/pressed/);

    await button.dispatchEvent("pointerdown",{pointerId:pointerId+100,pointerType:"touch",bubbles:true,cancelable:true});
    await button.dispatchEvent("pointercancel",{pointerId:pointerId+100,pointerType:"touch",bubbles:true,cancelable:true});
    await expect.poll(() => page.evaluate(() => window.__lovecDebug.digSnapshot().holding)).toBe(true);

    await page.evaluate(name => window.dispatchEvent(new Event(name)), lifecycleEvent);
    await expect.poll(() => page.evaluate(() => window.__lovecDebug.digSnapshot().holding)).toBe(false);
    await expect(button).not.toHaveClass(/pressed/);
    pointerId++;
  }
});

test("syntetický souběh joysticku a akčního tlačítka drží dva nezávislé pointery", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.startsWith("desktop-"),"Vícedotykové ovládání se ověřuje v mobilních projektech; nejde o fyzický multi-touch test.");
  await openDebug(page);
  await page.evaluate(() => window.__lovecDebug.startScaleReference());
  const zone=page.locator("#moveZone");
  const action=page.locator("#actionButton");
  const box=await zone.boundingBox();
  expect(box).toBeTruthy();

  const startX=box.x+box.width*.5,startY=box.y+box.height*.5;
  await zone.dispatchEvent("pointerdown",{pointerId:71,pointerType:"touch",clientX:startX,clientY:startY,bubbles:true,cancelable:true});
  await zone.dispatchEvent("pointermove",{pointerId:71,pointerType:"touch",clientX:startX+box.width*.28,clientY:startY-box.height*.12,bubbles:true,cancelable:true});
  const moving=await page.evaluate(() => window.__lovecDebug.snapshot().input);
  expect(Math.abs(moving.x)+Math.abs(moving.y)).toBeGreaterThan(.1);

  await action.dispatchEvent("pointerdown",{pointerId:72,pointerType:"touch",bubbles:true,cancelable:true});
  const combined=await page.evaluate(() => window.__lovecDebug.snapshot().input);
  expect(combined.pressed).toBe(true);
  expect(Math.abs(combined.x)+Math.abs(combined.y)).toBeGreaterThan(.1);

  await action.dispatchEvent("pointerup",{pointerId:72,pointerType:"touch",bubbles:true,cancelable:true});
  const afterAction=await page.evaluate(() => window.__lovecDebug.snapshot().input);
  expect(afterAction.pressed).toBe(false);
  expect(Math.abs(afterAction.x)+Math.abs(afterAction.y)).toBeGreaterThan(.1);

  await zone.dispatchEvent("lostpointercapture",{pointerId:71,pointerType:"touch",bubbles:true});
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.snapshot().input)).toEqual({x:0,y:0,pressed:false});
});

test("modal skryje gameplay i probíhající neinteraktivní oznámení před asistivní technologií", async ({ page }) => {
  await openDebug(page);
  await page.evaluate(() => {
    window.__lovecDebug.startLevel(3);
    window.__lovecDebug.triggerTheft();
  });
  await expect(page.locator("#theftAlert")).not.toHaveAttribute("aria-hidden","true");
  await expect(page.locator("#bossIntro")).not.toHaveAttribute("aria-hidden","true");

  await page.keyboard.press("Escape");
  await expect(page.locator("#pauseScreen")).toHaveClass(/visible/);
  await expect(page.locator("#game")).toHaveAttribute("inert","");
  await expect(page.locator("#hud")).toHaveAttribute("inert","");
  await expect(page.locator("#controls")).toHaveAttribute("inert","");
  await expect(page.locator("#theftAlert")).toHaveAttribute("aria-hidden","true");
  await expect(page.locator("#bossIntro")).toHaveAttribute("aria-hidden","true");

  await page.keyboard.press("Escape");
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.snapshot().mode)).toBe("playing");
  await expect(page.locator("#theftAlert")).not.toHaveAttribute("aria-hidden","true");
  await expect(page.locator("#bossIntro")).not.toHaveAttribute("aria-hidden","true");
});

test("automatické podmínky pro pinch-to-zoom zůstávají povolené mimo herní ovladače", async ({ page }) => {
  // Viewport emulation only verifies CSS/viewport preconditions. Physical pinch-to-zoom
  // still requires a separate manual check on a real phone.
  await page.goto("/");
  const audit = await page.evaluate(() => {
    const viewport = document.querySelector('meta[name="viewport"]')?.content || "";
    return {
      viewport,
      htmlTouch: getComputedStyle(document.documentElement).touchAction,
      bodyTouch: getComputedStyle(document.body).touchAction,
      appTouch: getComputedStyle(document.getElementById("app")).touchAction,
      gameTouch: getComputedStyle(document.getElementById("game")).touchAction,
      joystickTouch: getComputedStyle(document.getElementById("moveZone")).touchAction,
      actionTouch: getComputedStyle(document.getElementById("actionButton")).touchAction,
      digTouch: getComputedStyle(document.getElementById("digButton")).touchAction
    };
  });
  expect(audit.viewport).not.toMatch(/user-scalable\s*=\s*no/i);
  expect(audit.viewport).not.toMatch(/maximum-scale\s*=\s*(?:0|1(?:\.0*)?)(?:,|$)/i);
  for (const value of [audit.htmlTouch,audit.bodyTouch,audit.appTouch,audit.gameTouch]) { expect(value).not.toBe("none"); expect(value).toMatch(/pinch-zoom|manipulation|auto/); }
  expect(audit.joystickTouch).toBe("none");
  expect(audit.actionTouch).toBe("none");
  expect(audit.digTouch).toBe("none");
});

test("HTML obrazovky zůstávají dosažitelné při 200% reflow proxy v portrait i landscape", async ({ page }) => {
  const screens=[
    ["titleScreen","#recordsButton"],
    ["briefScreen","#briefButton"],
    ["digScreen","#digButton"],
    ["identifyScreen","#glassButton"],
    ["dialogScreen","#dialogButton"],
    ["perkScreen","#perkTitle"],
    ["expertiseScreen","#expertiseButton"],
    ["juryScreen","#juryButton"],
    ["resultScreen","#resultRecordsButton"],
    ["pauseScreen","#menuButton"],
    ["howScreen","#closeHowButton"],
    ["recordsScreen","#closeRecordsButton"]
  ];
  for(const viewport of [{width:195,height:422},{width:422,height:195}]){
    await page.setViewportSize(viewport);
    await page.goto("/");
    for(const [screenId,targetSelector] of screens){
      await page.evaluate(id=>{
        for(const node of document.querySelectorAll(".screen")){
          node.classList.toggle("visible",node.id===id);
          node.toggleAttribute("inert",node.id!==id);
          if(node.id===id)node.removeAttribute("aria-hidden");else node.setAttribute("aria-hidden","true");
        }
        const active=document.getElementById(id);
        active.scrollTop=0;active.scrollLeft=0;
      },screenId);
      const target=page.locator(targetSelector);
      await target.evaluate(element=>element.scrollIntoView({block:"nearest",inline:"nearest"}));
      const metrics=await page.evaluate(({screenId,targetSelector})=>{
        const screen=document.getElementById(screenId),target=document.querySelector(targetSelector);
        const r=target.getBoundingClientRect();
        return {
          overflowY:getComputedStyle(screen).overflowY,
          touchAction:getComputedStyle(screen).touchAction,
          scrollHeight:screen.scrollHeight,
          clientHeight:screen.clientHeight,
          rect:{left:r.left,top:r.top,right:r.right,bottom:r.bottom},
          viewport:{width:innerWidth,height:innerHeight}
        };
      },{screenId,targetSelector});
      expect(metrics.overflowY,screenId).toMatch(/auto|scroll/);
      expect(metrics.touchAction,screenId).toMatch(/pinch-zoom|auto|manipulation/);
      expect(metrics.rect.right,screenId).toBeGreaterThan(0);
      expect(metrics.rect.left,screenId).toBeLessThan(metrics.viewport.width);
      expect(metrics.rect.bottom,screenId).toBeGreaterThan(0);
      expect(metrics.rect.top,screenId).toBeLessThan(metrics.viewport.height);
    }
  }
});

test("syntetický 200% Chromium page scale zachová visualViewport a souřadnice joysticku", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name!=="iphone-portrait","CDP pageScaleFactor je Chromium-only automatická aproximace, nikoli skutečný pinch.");
  await openDebug(page);
  const cdp=await page.context().newCDPSession(page);
  await cdp.send("Emulation.setPageScaleFactor",{pageScaleFactor:2});
  await expect.poll(() => page.evaluate(() => visualViewport?.scale||1)).toBeGreaterThan(1.9);
  await page.locator("#recordsButton").evaluate(element=>element.scrollIntoView({block:"nearest",inline:"nearest"}));
  const reach=await page.evaluate(()=>{
    const vv=visualViewport,rect=document.getElementById("recordsButton").getBoundingClientRect();
    return {scale:vv.scale,left:rect.left,top:rect.top,right:rect.right,bottom:rect.bottom,vvLeft:vv.offsetLeft,vvTop:vv.offsetTop,vvRight:vv.offsetLeft+vv.width,vvBottom:vv.offsetTop+vv.height};
  });
  expect(reach.scale).toBeGreaterThan(1.9);
  expect(reach.right).toBeGreaterThan(reach.vvLeft);
  expect(reach.left).toBeLessThan(reach.vvRight);
  expect(reach.bottom).toBeGreaterThan(reach.vvTop);
  expect(reach.top).toBeLessThan(reach.vvBottom);

  await page.evaluate(() => window.__lovecDebug.startScaleReference());
  const zone=page.locator("#moveZone");
  const box=await zone.evaluate(element=>{
    const r=element.getBoundingClientRect();
    return {left:r.left,top:r.top,width:r.width,height:r.height};
  });
  const cx=box.left+box.width/2,cy=box.top+box.height/2;
  await zone.dispatchEvent("pointerdown",{pointerId:81,pointerType:"touch",clientX:cx,clientY:cy,bubbles:true,cancelable:true});
  await zone.dispatchEvent("pointermove",{pointerId:81,pointerType:"touch",clientX:cx+box.width*.25,clientY:cy,bubbles:true,cancelable:true});
  expect((await page.evaluate(() => window.__lovecDebug.snapshot().input)).x).toBeGreaterThan(.2);
  await zone.dispatchEvent("pointercancel",{pointerId:81,pointerType:"touch",bubbles:true,cancelable:true});
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.snapshot().input)).toEqual({x:0,y:0,pressed:false});
  await cdp.send("Emulation.setPageScaleFactor",{pageScaleFactor:1});
});

test("živé regiony neobsahují časovač ani průběžný pohyb ukazatele", async ({ page }) => {
  await page.goto("/");
  const live=await page.evaluate(() => [...document.querySelectorAll("[aria-live]")].map(node=>node.id).sort());
  expect(live).toEqual(["bossIntro","digFeedback","fraudFeedback","theftAlert","toast"].sort());
  await expect(page.locator("#digMeter")).not.toHaveAttribute("aria-live",/.+/);
  await expect(page.locator("#digTimerFill")).not.toHaveAttribute("aria-live",/.+/);
  await expect(page.locator("#hud")).not.toHaveAttribute("aria-live",/.+/);
});

test("prefers-reduced-motion vypne CSS pohybové efekty a přechody", async ({ page }) => {
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto("/");
  const audit=await page.evaluate(() => {
    const parse=values=>values.split(",").map(value=>{
      const trimmed=value.trim();
      return trimmed.endsWith("ms")?parseFloat(trimmed)/1000:parseFloat(trimmed)||0;
    });
    const action=getComputedStyle(document.getElementById("actionButton"),"::before");
    const boss=getComputedStyle(document.getElementById("bossIntro"));
    const alert=getComputedStyle(document.getElementById("theftAlert"));
    return {
      matches:matchMedia("(prefers-reduced-motion: reduce)").matches,
      actionDurations:parse(action.animationDuration),
      bossTransitions:parse(boss.transitionDuration),
      alertDurations:parse(alert.animationDuration)
    };
  });
  expect(audit.matches).toBe(true);
  expect(Math.max(...audit.actionDurations,0)).toBeLessThan(.01);
  expect(Math.max(...audit.bossTransitions,0)).toBeLessThan(.01);
  expect(Math.max(...audit.alertDurations,0)).toBeLessThan(.01);
});


test("odchod z pauzy zruší čekající odměnu kopání i zahrabávání", async ({ page }) => {
  await openDebug(page);

  await page.evaluate(() => window.__lovecDebug.startDigChallenge());
  for(let hit=0;hit<3;hit++){
    await page.evaluate(() => {
      window.__lovecDebug.setDigSpeed(0);
      window.__lovecDebug.setDigMarker(window.__lovecDebug.digSnapshot().zoneCenter);
    });
    await page.keyboard.press("Space");
    if(hit<2)await page.waitForTimeout(125);
  }
  await page.keyboard.press("Escape");
  await expect(page.locator("#pauseScreen")).toHaveClass(/visible/);
  expect((await page.evaluate(() => window.__lovecDebug.digSnapshot())).finishDelay).toBeGreaterThan(0);
  await page.locator("#menuButton").click();
  await page.waitForTimeout(500);
  expect((await page.evaluate(() => window.__lovecDebug.snapshot())).state.stones).toBe(0);
  await page.locator("#continueButton").click();
  await page.locator("#briefButton").click();
  const restoredDig=await page.evaluate(() => window.__lovecDebug.snapshot());
  expect(restoredDig.state.stones).toBe(0);
  expect(restoredDig.world.hotspots).toBe(4);

  await page.evaluate(() => window.__lovecDebug.startFillChallenge());
  for(let transfer=0;transfer<3;transfer++){
    await page.evaluate(() => {
      window.__lovecDebug.setDigSpeed(0);
      window.__lovecDebug.setDigMarker(window.__lovecDebug.digSnapshot().zoneCenter);
    });
    await page.keyboard.down("Space");
    await page.keyboard.up("Space");
  }
  await page.keyboard.press("Escape");
  await expect(page.locator("#pauseScreen")).toHaveClass(/visible/);
  expect((await page.evaluate(() => window.__lovecDebug.digSnapshot())).finishDelay).toBeGreaterThan(0);
  await page.locator("#menuButton").click();
  await page.waitForTimeout(500);
  await page.locator("#continueButton").click();
  await page.locator("#briefButton").click();
  const restoredFill=await page.evaluate(() => ({fill:window.__lovecDebug.fillSnapshot(),snapshot:window.__lovecDebug.snapshot()}));
  expect(restoredFill.fill.open).toBe(1);
  expect(restoredFill.fill.filled).toBe(0);
  expect(restoredFill.snapshot.state.score).toBe(0);
});

test("zahrabávání přes pauzu zruší držení, zmrazí odměnu a započítá ji právě jednou", async ({ page }) => {
  await openDebug(page);
  await page.evaluate(() => window.__lovecDebug.startFillChallenge());
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.digSnapshot().kind)).toBe("fill");

  await page.keyboard.down("Space");
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.digSnapshot().holding)).toBe(true);
  await page.keyboard.press("Escape");
  await page.keyboard.up("Space");
  await expect(page.locator("#pauseScreen")).toHaveClass(/visible/);
  expect(await page.evaluate(() => window.__lovecDebug.digSnapshot().holding)).toBe(false);

  await page.keyboard.press("Escape");
  for (let transfer=1;transfer<=3;transfer+=1) {
    await page.evaluate(() => {
      window.__lovecDebug.setDigSpeed(0);
      window.__lovecDebug.setDigMarker(window.__lovecDebug.digSnapshot().zoneCenter);
    });
    await page.keyboard.down("Space");
    await page.keyboard.up("Space");
    if(transfer<3) await expect.poll(() => page.evaluate(() => window.__lovecDebug.digSnapshot().hits)).toBe(transfer);
  }

  await page.keyboard.press("Escape");
  await expect(page.locator("#pauseScreen")).toHaveClass(/visible/);
  const pending = await page.evaluate(() => ({dig:window.__lovecDebug.digSnapshot(),fill:window.__lovecDebug.fillSnapshot(),score:window.__lovecDebug.snapshot().state.score}));
  expect(pending.dig.hits).toBe(3);
  expect(pending.dig.finishDelay).toBeGreaterThan(0);
  expect(pending.fill.filled).toBe(0);
  await page.waitForTimeout(500);
  const frozen = await page.evaluate(() => ({dig:window.__lovecDebug.digSnapshot(),fill:window.__lovecDebug.fillSnapshot(),score:window.__lovecDebug.snapshot().state.score}));
  expect(frozen.dig.finishDelay).toBe(pending.dig.finishDelay);
  expect(frozen.fill.filled).toBe(0);
  expect(frozen.score).toBe(pending.score);

  await page.keyboard.press("Escape");
  await expect.poll(() => page.evaluate(() => window.__lovecDebug.snapshot().mode)).toBe("playing");
  const after = await page.evaluate(() => ({snapshot:window.__lovecDebug.snapshot(),fill:window.__lovecDebug.fillSnapshot()}));
  expect(after.fill.filled).toBe(1);
  expect(after.fill.open).toBe(0);
  const score = after.snapshot.state.score;
  await page.waitForTimeout(500);
  const stable = await page.evaluate(() => ({snapshot:window.__lovecDebug.snapshot(),fill:window.__lovecDebug.fillSnapshot()}));
  expect(stable.fill.filled).toBe(1);
  expect(stable.snapshot.state.score).toBe(score);
});
