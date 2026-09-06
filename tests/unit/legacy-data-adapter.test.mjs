import test from "node:test";
import assert from "node:assert/strict";
import {
  LegacyDataAdapter,
  createLegacyLevelTable,
  createLegacyPerkTable,
  createLegacySampleTable,
  LEVEL_DEFINITIONS,
  PERK_DEFINITIONS,
  SAMPLE_DEFINITIONS
} from "../../src/index.js";

test("legacy tables preserve the exact property shape expected by game.js", () => {
  const levels = createLegacyLevelTable();
  const perks = createLegacyPerkTable();
  const samples = createLegacySampleTable();

  assert.deepEqual(Object.keys(levels[0]), ["id", "name", "title", "theme", "text", "goal", "music"]);
  assert.deepEqual(Object.keys(perks[0]), ["id", "icon", "name", "text", "max"]);
  assert.deepEqual(Object.keys(samples[0]), ["real", "title", "text"]);
  assert.equal(levels[0].id, "chlum");
  assert.equal(levels.at(-1).id, "slavia");
  assert.equal(samples.some(sample => sample.real), true);
  assert.equal(samples.some(sample => !sample.real), true);
});

test("legacy tables are detached immutable projections", () => {
  const levels = createLegacyLevelTable();
  assert.equal(Object.isFrozen(levels), true);
  assert.equal(Object.isFrozen(levels[0]), true);
  assert.notStrictEqual(levels[0], LEVEL_DEFINITIONS[0]);
  assert.equal("objectives" in levels[0], false);
  assert.equal("hazards" in levels[0], false);
});

test("LegacyDataAdapter installs and removes a read-only namespace", () => {
  const target = {};
  const adapter = new LegacyDataAdapter();
  const snapshot = adapter.install(target, "GAME_DATA");

  assert.strictEqual(target.GAME_DATA, snapshot);
  assert.strictEqual(snapshot.LEVELS, adapter.levels);
  assert.strictEqual(snapshot.PERKS, adapter.perks);
  assert.strictEqual(snapshot.SAMPLES, adapter.samples);
  assert.equal(Object.getOwnPropertyDescriptor(target, "GAME_DATA").writable, false);
  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal(adapter.uninstall(target, "GAME_DATA"), true);
  assert.equal("GAME_DATA" in target, false);
  assert.equal(adapter.uninstall(target, "GAME_DATA"), false);
});

test("LegacyDataAdapter validates custom data before exposing it", () => {
  const invalidLevels = LEVEL_DEFINITIONS.map(level => ({
    ...level,
    objectives: level.objectives.map(objective => ({ ...objective })),
    hazards: [...level.hazards]
  }));
  invalidLevels[0].objectives[0].required = 0;

  assert.throws(() => new LegacyDataAdapter({
    levels: invalidLevels,
    perks: PERK_DEFINITIONS,
    samples: SAMPLE_DEFINITIONS
  }), { name: "GameDataValidationError" });
});
