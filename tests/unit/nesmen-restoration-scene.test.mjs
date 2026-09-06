import test from "node:test";
import assert from "node:assert/strict";
import { NesmenRestorationScene } from "../../src/scenes/NesmenRestorationScene.js";
import { evaluateObjective } from "../../src/gameplay/Objectives.js";

function createHarness() {
  const components = new Map([
    [1, {
      digSpot: { dug: true, filled: false },
      interaction: { kind: "fill", label: "ZAHRABAT", enabled: true }
    }],
    [2, {
      digSpot: { dug: false, filled: false },
      interaction: { kind: "dig", label: "KOPAT", enabled: true }
    }],
    [3, {
      digSpot: { dug: false, filled: false },
      interaction: { kind: "dig", label: "KOPAT", enabled: true }
    }]
  ]);
  const visuals = new Map([1, 2, 3].map(entity => [entity, {
    marker: { visible: true },
    hole: { visible: false }
  }]));
  const scene = Object.create(NesmenRestorationScene.prototype);
  scene.profileEntities = [1, 2, 3];
  scene.session = { state: { flags: { nesmenPermission: true } } };
  scene.profileVisuals = visuals;
  scene.app = {
    world: {
      get(entity, component) {
        return components.get(entity)?.[component] ?? null;
      }
    }
  };
  return { scene, components, visuals };
}

test("open Nesměň profile owns ZAHRNOUT and blocks every other profile", () => {
  const { scene, components, visuals } = createHarness();
  scene.syncProfileInteractions();

  assert.equal(scene.openProfileEntity(), 1);
  assert.deepEqual(components.get(1).interaction, { kind: "fill", label: "ZAHRNOUT", enabled: true });
  assert.equal(visuals.get(1).hole.visible, true);
  assert.equal(visuals.get(1).marker.visible, false);
  assert.equal(components.get(2).interaction.enabled, false);
  assert.equal(components.get(3).interaction.enabled, false);
  assert.equal(visuals.get(2).marker.visible, false);
  assert.equal(visuals.get(3).marker.visible, false);
  assert.equal(evaluateObjective("nesmen", { permit: true, dug: 1, filled: 0, findings: 0 }).text, "Zasyp otevřenou díru");
});

test("filling the open profile unlocks only remaining undug profiles", () => {
  const { scene, components, visuals } = createHarness();
  components.get(1).digSpot.filled = true;
  scene.syncProfileInteractions();

  assert.equal(scene.openProfileEntity(), null);
  assert.equal(components.get(1).interaction.enabled, false);
  assert.deepEqual(components.get(2).interaction, { kind: "dig", label: "KOPAT", enabled: true });
  assert.deepEqual(components.get(3).interaction, { kind: "dig", label: "KOPAT", enabled: true });
  assert.equal(visuals.get(1).hole.visible, false);
  assert.equal(visuals.get(2).marker.visible, true);
  assert.equal(visuals.get(3).marker.visible, true);
});
