import test from "node:test";
import assert from "node:assert/strict";
import {
  createGameState,
  cloneGameState,
  validateGameState,
  CURRENT_SAVE_KEY,
  LEGACY_SAVE_KEYS,
  parseLegacySave,
  serializeLegacySave,
  readLegacySave,
  migrateLegacySave,
  evaluateObjective,
  isObjectiveComplete
} from "../../src/domain/index.js";

class MemoryStorage {
  constructor(entries = {}) { this.values = new Map(Object.entries(entries)); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

test("GameState normalizuje poškozené hodnoty", () => {
  const state = createGameState({
    levelIndex: 99, score: -200, heat: 140, combo: 50, comboTimer: -3, caught: -2, sound: false,
    perks: { boots: 20, case: 1 }, stats: { digs: "4", misses: -3 },
    stones: [{ id: "a", weight: "2.5", quality: 180, value: -20, documented: false }, null]
  });
  assert.equal(state.levelIndex, 3);
  assert.equal(state.score, 0);
  assert.equal(state.heat, 100);
  assert.equal(state.combo, 6);
  assert.equal(state.comboTimer, 0);
  assert.equal(state.caught, 0);
  assert.equal(state.sound, false);
  assert.equal(state.perks.boots, 3);
  assert.equal(state.perks.case, 1);
  assert.equal(state.stats.digs, 4);
  assert.equal(state.stats.misses, 0);
  assert.equal(state.stones.length, 1);
  assert.equal(state.stones[0].weight, 2.5);
  assert.equal(state.stones[0].quality, 100);
  assert.equal(state.stones[0].value, 0);
  assert.equal(validateGameState(state).valid, true);
});

test("cloneGameState oddělí vnořené struktury", () => {
  const original = createGameState({ stones: [{ id: "x", weight: 1 }], perks: { boots: 1 }, stats: { digs: 1 } });
  const copy = cloneGameState(original);
  copy.stones[0].weight = 9;
  copy.perks.boots = 2;
  copy.stats.digs = 5;
  assert.equal(original.stones[0].weight, 1);
  assert.equal(original.perks.boots, 1);
  assert.equal(original.stats.digs, 1);
});

test("validateGameState odmítá neplatnou strukturu", () => {
  const result = validateGameState({ levelIndex: -1, score: -1, heat: 200, combo: 0 });
  assert.equal(result.valid, false);
  assert.ok(result.errors.length >= 6);
});

test("save serializace zachová schema 5.1", () => {
  const parsed = parseLegacySave(serializeLegacySave(createGameState({ score: 1200, stones: [{ id: "one", weight: 1.25 }] })));
  assert.equal(parsed.version, "5.1.0");
  assert.equal(parsed.schemaVersion, "5.1");
  assert.equal(parsed.score, 1200);
  assert.equal(parsed.stones[0].weight, 1.25);
});

test("readLegacySave upřednostní aktuální klíč", () => {
  const storage = new MemoryStorage({
    [CURRENT_SAVE_KEY]: JSON.stringify({ ...createGameState({ score: 500 }), stones: [] }),
    [LEGACY_SAVE_KEYS[0]]: JSON.stringify({ ...createGameState({ score: 100 }), stones: [] })
  });
  const found = readLegacySave(storage);
  assert.equal(found.key, CURRENT_SAVE_KEY);
  assert.equal(found.state.score, 500);
  assert.equal(found.migrated, false);
});

test("migrateLegacySave převede starší klíč a zachová zdroj", () => {
  const sourceKey = LEGACY_SAVE_KEYS[2];
  const storage = new MemoryStorage({
    [sourceKey]: JSON.stringify({ version: "4.8.0", levelIndex: 2, score: 900, stones: [], heat: 20, combo: 2, comboTimer: 3, caught: 1, perks: { boots: 1 }, stats: { digs: 2 }, sound: true })
  });
  const result = migrateLegacySave(storage);
  assert.equal(result.sourceKey, sourceKey);
  assert.equal(result.key, CURRENT_SAVE_KEY);
  assert.equal(result.migrated, true);
  assert.ok(storage.getItem(CURRENT_SAVE_KEY));
  assert.ok(storage.getItem(sourceKey));
  assert.equal(parseLegacySave(storage.getItem(CURRENT_SAVE_KEY)).score, 900);
});

test("migrateLegacySave odstraní zdroj pouze na vyžádání", () => {
  const sourceKey = LEGACY_SAVE_KEYS.at(-1);
  const storage = new MemoryStorage({ [sourceKey]: JSON.stringify({ ...createGameState({ score: 77 }), stones: [] }) });
  migrateLegacySave(storage, { removeSource: true });
  assert.equal(storage.getItem(sourceKey), null);
  assert.ok(storage.getItem(CURRENT_SAVE_KEY));
});

test("Chlum vyžaduje povolení, tři zásahy i nález", () => {
  assert.equal(evaluateObjective("chlum", { permit: false, digHits: 3, findings: 1 }).text, "Promluv s Václavem");
  assert.equal(isObjectiveComplete("chlum", { permit: true, digHits: 2, findings: 1 }), false);
  assert.equal(isObjectiveComplete("chlum", { permit: true, digHits: 3, findings: 1 }), true);
});

test("Nesměň vyžaduje povolení, kopání, zahrabání i nález", () => {
  assert.equal(evaluateObjective("nesmen", { permit: false }).text, "Získej souhlas lesníka");
  assert.equal(isObjectiveComplete("nesmen", { permit: true, dug: 3, filled: 2, findings: 1 }), false);
  assert.equal(evaluateObjective("nesmen", { permit: true, dug: 3, filled: 3, findings: 0 }).text, "Vyzvedni nalezený vltavín");
  assert.equal(isObjectiveComplete("nesmen", { permit: true, dug: 3, filled: 3, findings: 0 }), false);
  assert.equal(isObjectiveComplete("nesmen", { permit: true, dug: 3, filled: 3, findings: 1 }), true);
});

test("Besednice používá texty všech fází", () => {
  assert.equal(evaluateObjective("besednice", { clues: 2 }).text, "Stopy 2/3");
  assert.equal(evaluateObjective("besednice", { clues: 3 }).text, "Vykopej ježkový profil");
  assert.equal(evaluateObjective("besednice", { clues: 3, hedgehog: true, bossStarted: true }).text, "Dostaň ježek zpět");
  assert.equal(evaluateObjective("besednice", { clues: 3, hedgehog: true, bossStarted: true, bossDefeated: true }).text, "Ježek je v bezpečí");
});

test("Slavia vyžaduje dokumenty, znalkyni, Frantu, certifikát i vstup", () => {
  assert.equal(evaluateObjective("slavia", { papers: 2 }).text, "Dokumenty 2/3");
  assert.equal(evaluateObjective("slavia", { papers: 3 }).text, "Promluv se znalkyní");
  assert.equal(evaluateObjective("slavia", { papers: 3, expertConsulted: true }).text, "Získej kámen zpět od Franty");
  assert.equal(isObjectiveComplete("slavia", { papers: 3, expertConsulted: true, bossStarted: true, bossDefeated: true }), false);
  assert.equal(isObjectiveComplete("slavia", {
    papers: 3,
    expertConsulted: true,
    bossStarted: true,
    bossDefeated: true,
    certified: true,
    entered: true
  }), true);
});

test("progress objektivů zůstává v rozsahu 0 až 1", () => {
  const cases = [
    ["chlum", { permit: true, digHits: 999, findings: 999 }],
    ["nesmen", { permit: true, dug: 999, filled: 999, findings: 999 }],
    ["besednice", { clues: 999, hedgehog: true, bossStarted: true, bossDefeated: true }],
    ["slavia", { papers: 999, expertConsulted: true, bossStarted: true, bossDefeated: true, certified: true, entered: true }]
  ];
  for (const [level, runtime] of cases) {
    const progress = evaluateObjective(level, runtime).progress;
    assert.ok(progress >= 0 && progress <= 1, `${level}: ${progress}`);
  }
});
