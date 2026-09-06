import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";

const rootUrl = new URL("../../", import.meta.url);
const serviceWorkerSource = fs.readFileSync(new URL("sw.js", rootUrl), "utf8");
const html = fs.readFileSync(new URL("index.html", rootUrl), "utf8");
const css = fs.readFileSync(new URL("style.css", rootUrl), "utf8");

const response = ({ ok = true, url = "https://example.test/game/style.css" } = {}) => ({
  ok,
  url,
  clone() { return response({ ok, url }); }
});

const createHarness = ({ fetchImpl, putImpl, matchImpl } = {}) => {
  const listeners = new Map();
  const calls = { addAll: [], delete: [], fetch: [], match: [], put: [], skipWaiting: 0, claim: 0 };
  const cache = {
    async addAll(paths) {
      calls.addAll.push([...paths]);
    },
    async put(request, cachedResponse) {
      calls.put.push({ request, response: cachedResponse });
      return putImpl?.(request, cachedResponse);
    },
    async match(request) {
      calls.match.push(request);
      return matchImpl?.(request);
    }
  };
  const sandbox = {
    console,
    Promise,
    Set,
    URL,
    fetch: async request => {
      calls.fetch.push(request);
      return fetchImpl?.(request) ?? response();
    },
    caches: {
      async open() { return cache; },
      async keys() { return ["old-cache", "lovec-vltavinu-slavia-v6-2-release-2"]; },
      async delete(key) { calls.delete.push(key); return true; }
    },
    self: {
      location: { origin: "https://example.test" },
      registration: { scope: "https://example.test/game/" },
      addEventListener(type, listener) { listeners.set(type, listener); },
      async skipWaiting() { calls.skipWaiting += 1; },
      clients: { async claim() { calls.claim += 1; } }
    }
  };
  vm.runInNewContext(serviceWorkerSource, sandbox, { filename: "sw.js" });
  return { calls, listeners };
};

const dispatchFetch = (listener, request) => {
  let responsePromise;
  listener({ request, respondWith(value) { responsePromise = Promise.resolve(value); } });
  return responsePromise;
};

test("install pre-caches the app shell and runtime modules without level assets", async () => {
  const { calls, listeners } = createHarness();
  let lifetime;
  listeners.get("install")({ waitUntil(value) { lifetime = value; } });
  await lifetime;

  assert.equal(calls.addAll.length, 1);
  const precache = calls.addAll[0];
  assert.ok(precache.includes("./index.html"));
  assert.ok(precache.includes("./src/bootstrap.js"));
  assert.ok(precache.includes("./assets/manifests/assets.json"));
  assert.equal(precache.some(path => /^\.\/assets\/(?:audio|models|sprites|textures)\//.test(path)), false);
  assert.equal(calls.skipWaiting, 1);
});

test("successful same-origin runtime response waits for its cache write", async () => {
  let startPut;
  const putStarted = new Promise(resolve => { startPut = resolve; });
  let finishPut;
  const pendingPut = new Promise(resolve => { finishPut = resolve; });
  const networkResponse = response();
  const { calls, listeners } = createHarness({
    fetchImpl: async () => networkResponse,
    putImpl: () => { startPut(); return pendingPut; }
  });
  const request = { method: "GET", mode: "same-origin", url: "https://example.test/game/style.css" };
  const pendingResponse = dispatchFetch(listeners.get("fetch"), request);

  await putStarted;
  let settled = false;
  pendingResponse.then(() => { settled = true; });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(settled, false, "response resolved before cache.put completed");

  finishPut();
  assert.equal(await pendingResponse, networkResponse);
  assert.equal(calls.put.length, 1);
  assert.equal(calls.put[0].request, request);
});

test("error, unknown and cross-origin responses are never cached", async () => {
  for (const scenario of [
    {
      request: { method: "GET", mode: "same-origin", url: "https://example.test/game/style.css" },
      networkResponse: response({ ok: false })
    },
    {
      request: { method: "GET", mode: "same-origin", url: "https://example.test/game/debug.txt" },
      networkResponse: response({ url: "https://example.test/game/debug.txt" })
    },
    {
      request: { method: "GET", mode: "same-origin", url: "https://example.test/game/style.css" },
      networkResponse: response({ url: "https://cdn.example/style.css" })
    }
  ]) {
    const { calls, listeners } = createHarness({ fetchImpl: async () => scenario.networkResponse });
    assert.equal(await dispatchFetch(listeners.get("fetch"), scenario.request), scenario.networkResponse);
    assert.equal(calls.put.length, 0);
  }

  const { calls, listeners } = createHarness();
  const crossOriginRequest = { method: "GET", mode: "cors", url: "https://cdn.example/texture.png" };
  assert.equal(dispatchFetch(listeners.get("fetch"), crossOriginRequest), undefined);
  assert.equal(calls.fetch.length, 0);
  assert.equal(calls.put.length, 0);
});

test("mobile viewport permits zoom and gesture blocking stays on game controls", () => {
  const viewport = html.match(/<meta name="viewport" content="([^"]+)">/)?.[1] ?? "";
  assert.doesNotMatch(viewport, /user-scalable\s*=\s*no|maximum-scale\s*=\s*1/);
  assert.doesNotMatch(css, /html,body\{[^}]*touch-action:none/);
  assert.doesNotMatch(css, /html,body\{[^}]*user-select:none/);
  assert.doesNotMatch(css, /#app\{[^}]*touch-action:none/);
  assert.match(css, /#game\{[^}]*touch-action:none[^}]*user-select:none/);
  assert.match(css, /\.controls,\.controls \*\{[^}]*user-select:none/);
});

test("reduced-motion preference covers every CSS animation and transition", () => {
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)\{\*,\*::before,\*::after\{/);
  assert.match(css, /animation-duration:\.01ms!important/);
  assert.match(css, /animation-iteration-count:1!important/);
  assert.match(css, /transition-duration:\.01ms!important/);
});
