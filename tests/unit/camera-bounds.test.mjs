import assert from "node:assert/strict";
import test from "node:test";
import { resolveBoundedCameraCenter, setBoundedCameraCenter } from "../../src/render/CameraBounds.js";

test("desktop camera stays inside a level at an edge spawn", () => {
  const center = resolveBoundedCameraCenter({
    bounds: { x: 0, y: 0, width: 1500, height: 1200 },
    x: 180,
    y: 980,
    viewHeight: 720,
    viewportWidth: 1280,
    viewportHeight: 720,
    zoom: 0.92
  });

  assert.ok(center.x > 690 && center.x < 700);
  assert.ok(center.y > 808 && center.y < 810);
});

test("mobile camera can follow a player without exposing space outside bounds", () => {
  const center = resolveBoundedCameraCenter({
    bounds: { x: 0, y: 0, width: 1680, height: 1280 },
    x: 140,
    y: 1040,
    viewHeight: 720,
    viewportWidth: 390,
    viewportHeight: 844,
    zoom: 0.9
  });

  assert.ok(center.x > 184 && center.x < 186);
  assert.equal(center.y, 880);
});

test("camera centers a map that is smaller than the visible viewport", () => {
  const center = resolveBoundedCameraCenter({
    bounds: { x: 20, y: 30, width: 500, height: 400 },
    x: 30,
    y: 40,
    viewHeight: 720,
    viewportWidth: 1280,
    viewportHeight: 720,
    zoom: 1
  });

  assert.deepEqual(center, { x: 270, y: 230, zoom: 1 });
});

test("renderer adapter applies the resolved bounded center", () => {
  const calls = [];
  const renderer = {
    viewHeight: 720,
    width: 1280,
    height: 720,
    setCameraCenter: (...args) => calls.push(args)
  };

  const center = setBoundedCameraCenter(renderer, { x: 0, y: 0, width: 1800, height: 1100 }, 160, 860, 0.9);

  assert.deepEqual(calls, [[center.x, center.y, 0.9]]);
  assert.ok(center.x > 711 && center.x < 712);
  assert.equal(center.y, 700);
});
