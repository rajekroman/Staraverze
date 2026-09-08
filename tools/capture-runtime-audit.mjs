import { chromium } from "@playwright/test";
import { execFileSync, spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

// Run from the repository root. Optional base revision produces an equivalent before/after capture.
const baseline = process.argv[2];
const output = resolve(process.env.AUDIT_OUTPUT || "test-results/audit");
const port = Number(process.env.AUDIT_PORT || 4187);
const url = `http://127.0.0.1:${port}`;
const source = baseline ? execFileSync("git", ["show", `${baseline}:game.js`], { encoding: "utf8" }) : null;
mkdirSync(output, { recursive: true });
const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], { stdio: "ignore" });
let browser;
const results = [];
try {
  for (let attempt = 0; attempt < 50; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 100));
    if (server.exitCode !== null) throw new Error("Audit server could not bind its dedicated port");
    try { if ((await fetch(`${url}/index.html`)).ok) break; } catch {}
    if (attempt === 49) throw new Error("Audit server startup timed out");
  }
  browser = await chromium.launch();
  for (const [name, width, height] of [["desktop",1280,720],["portrait",390,844],["landscape",844,390]]) {
    for (const variant of source ? ["before","after"] : ["after"]) {
      const context = await browser.newContext({ viewport: { width, height }, reducedMotion: "reduce", serviceWorkers: "block", hasTouch: name !== "desktop" });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.addInitScript(() => {
        let seed = 5482;
        Math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
      });
      if (variant === "before") await page.route("**/game.js", route => route.fulfill({ contentType: "text/javascript", body: source }));
      await page.clock.install({ time: new Date("2026-09-08T00:00:00Z") });
      await page.goto(`${url}/?debug=1`);
      await page.evaluate(() => {
        window.__lovecDebug.startLevel(4);
        window.__lovecDebug.setPlayer(532,430);
        window.auditHudWrites = 0;
        new MutationObserver(records => { window.auditHudWrites += records.length; })
          .observe(document.getElementById("objectiveLabel"), { childList: true });
      });
      await page.clock.runFor(1000);
      const writes = await page.evaluate(() => window.auditHudWrites);
      await page.screenshot({ path: `${output}/${name}-${variant}.png`, animations: "disabled" });
      results.push({ viewport: name, variant, objectiveWritesInOneSecond: writes, errors });
      if (errors.length) throw new Error(errors.join("\n"));
      await context.close();
    }
  }
  writeFileSync(`${output}/capture.json`, JSON.stringify({ baseline: baseline || null, results }, null, 2));
  console.log(JSON.stringify({ output, results }, null, 2));
} finally {
  await browser?.close();
  server.kill();
}
