import { test, expect } from "@playwright/test";
import { inflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";

const BASELINES = {};

function decodePng(buffer) {
  const signature = buffer.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a") throw new Error("Unexpected screenshot format");
  let offset = 8;
  let width = 0, height = 0, bitDepth = 0, colorType = 0;
  const idat = [];
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset); offset += 4;
    const type = buffer.subarray(offset, offset + 4).toString("ascii"); offset += 4;
    const data = buffer.subarray(offset, offset + length); offset += length + 4;
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
  }
  if (bitDepth !== 8 || ![2, 6].includes(colorType)) throw new Error(`Unsupported PNG bitDepth=${bitDepth}, colorType=${colorType}`);
  const channels = colorType === 6 ? 4 : 3;
  const bpp = channels;
  const stride = width * channels;
  const raw = inflateSync(Buffer.concat(idat));
  const pixels = Buffer.alloc(width * height * channels);
  let src = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = raw[src++];
    const row = raw.subarray(src, src + stride); src += stride;
    const out = pixels.subarray(y * stride, (y + 1) * stride);
    const prev = y ? pixels.subarray((y - 1) * stride, y * stride) : null;
    for (let x = 0; x < stride; x += 1) {
      const a = x >= bpp ? out[x - bpp] : 0;
      const b = prev ? prev[x] : 0;
      const c = prev && x >= bpp ? prev[x - bpp] : 0;
      let value = row[x];
      if (filter === 1) value = (value + a) & 255;
      else if (filter === 2) value = (value + b) & 255;
      else if (filter === 3) value = (value + Math.floor((a + b) / 2)) & 255;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        value = (value + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 255;
      } else if (filter !== 0) throw new Error(`Unsupported PNG filter ${filter}`);
      out[x] = value;
    }
  }
  return { width, height, channels, pixels };
}

function fingerprint(buffer, cols = 8, rows = 6) {
  const { width, height, channels, pixels } = decodePng(buffer);
  const values = [];
  for (let gy = 0; gy < rows; gy += 1) {
    const y0 = Math.floor(gy * height / rows), y1 = Math.max(y0 + 1, Math.floor((gy + 1) * height / rows));
    for (let gx = 0; gx < cols; gx += 1) {
      const x0 = Math.floor(gx * width / cols), x1 = Math.max(x0 + 1, Math.floor((gx + 1) * width / cols));
      let r = 0, g = 0, b = 0, count = 0;
      const stepX = Math.max(1, Math.floor((x1 - x0) / 12));
      const stepY = Math.max(1, Math.floor((y1 - y0) / 12));
      for (let y = y0; y < y1; y += stepY) {
        for (let x = x0; x < x1; x += stepX) {
          const i = (y * width + x) * channels;
          r += pixels[i]; g += pixels[i + 1]; b += pixels[i + 2]; count += 1;
        }
      }
      values.push(Math.round(r / count / 17), Math.round(g / count / 17), Math.round(b / count / 17));
    }
  }
  return values;
}

function visualDistance(actual, expected) {
  if (!expected || actual.length !== expected.length) return Infinity;
  let total = 0;
  for (let i = 0; i < actual.length; i += 1) total += Math.abs(actual[i] - expected[i]);
  return total / actual.length;
}

async function openDebug(page) {
  await page.goto("/?debug=1", { waitUntil: "domcontentloaded" });
  await expect.poll(() => page.evaluate(() => Boolean(window.__lovecDebug))).toBe(true);
}

async function capture(page, scene) {
  await page.waitForTimeout(120);
  const png = await page.screenshot({ fullPage: true, animations: "disabled" });
  mkdirSync("test-results/visual", { recursive: true });
  const project = test.info().project.name;
  writeFileSync(`test-results/visual/${project}-${scene}.png`, png);
  const fp = fingerprint(png);
  const key = `${project}:${scene}`;
  const expected = BASELINES[key];
  console.log(`VISUAL_BASELINE ${key}=${JSON.stringify(fp)}`);
  if (expected) expect(visualDistance(fp, expected), key).toBeLessThanOrEqual(1.25);
}

test("Chlum visual baseline", async ({ page }) => {
  await openDebug(page);
  await page.evaluate(() => {
    window.__lovecDebug.startLevel(0);
    window.__lovecDebug.setPlayer(930, 650);
  });
  await capture(page, "chlum");
});

test("radar reveal visual baseline", async ({ page }) => {
  await openDebug(page);
  await page.evaluate(() => {
    window.__lovecDebug.startLevel(0);
    window.__lovecDebug.setPlayer(500, 840);
    window.__lovecDebug.setScanCooldown(0);
    dispatchEvent(new KeyboardEvent("keydown", { code: "Space", bubbles: true, cancelable: true }));
    dispatchEvent(new KeyboardEvent("keyup", { code: "Space", bubbles: true, cancelable: true }));
    window.__lovecDebug.setScanPulse(.42);
  });
  await capture(page, "radar");
});

test("digging visual baseline", async ({ page }) => {
  await openDebug(page);
  await page.evaluate(() => {
    window.__lovecDebug.startDigChallenge(2);
    window.__lovecDebug.setDigSpeed(0);
    const state = window.__lovecDebug.digSnapshot();
    window.__lovecDebug.setDigMarker(state.zoneCenter);
    window.__lovecDebug.setDigTime(4);
  });
  await capture(page, "dig");
});
