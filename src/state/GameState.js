import { LEVEL_DEFINITIONS } from "../data/levels.js";
import { PERK_DEFINITIONS } from "../data/perks.js";

export const GAME_RUNTIME_VERSION = "6.0.0";
export const LEGACY_STATE_VERSION = "5.1.0";
export const SAVE_SCHEMA_VERSION = "5.1";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const nonNegativeInteger = value => Math.max(0, Math.floor(finite(value, 0)));

export const DEFAULT_STATS = Object.freeze({ digs: 0, correct: 0, misses: 0, rare: 0 });

export function createEmptyPerks() {
  return Object.fromEntries(PERK_DEFINITIONS.map(perk => [perk.id, 0]));
}

export function normalizePerks(input = {}) {
  const result = createEmptyPerks();
  for (const perk of PERK_DEFINITIONS) {
    const value = Number(input?.[perk.id]);
    result[perk.id] = Number.isFinite(value)
      ? Math.max(0, Math.min(perk.max, Math.floor(value)))
      : 0;
  }
  return result;
}

export function normalizeStats(input = {}) {
  return {
    digs: nonNegativeInteger(input?.digs),
    correct: nonNegativeInteger(input?.correct),
    misses: nonNegativeInteger(input?.misses),
    rare: nonNegativeInteger(input?.rare)
  };
}

function normalizeStone(stone, index) {
  if (!stone || typeof stone !== "object") return null;
  return {
    ...stone,
    id: String(stone.id || `legacy-stone-${index}`),
    locality: String(stone.locality || "Neznámá lokalita"),
    rarity: String(stone.rarity || "common"),
    weight: Math.max(0, finite(stone.weight, 0)),
    quality: clamp(Math.round(finite(stone.quality, 50)), 0, 100),
    documented: stone.documented !== false,
    name: String(stone.name || "Vltavín"),
    value: Math.max(0, Math.round(finite(stone.value, 0)))
  };
}

export function createGameState(overrides = {}) {
  const requestedLevel = Math.floor(finite(overrides.levelIndex, 0));
  const stones = Array.isArray(overrides.stones)
    ? overrides.stones.map(normalizeStone).filter(Boolean)
    : [];

  return {
    version: LEGACY_STATE_VERSION,
    schemaVersion: SAVE_SCHEMA_VERSION,
    runtimeVersion: GAME_RUNTIME_VERSION,
    levelIndex: clamp(requestedLevel, 0, LEVEL_DEFINITIONS.length - 1),
    score: Math.max(0, Math.round(finite(overrides.score, 0))),
    stones,
    heat: clamp(finite(overrides.heat, 0), 0, 100),
    combo: clamp(Math.floor(finite(overrides.combo, 1)), 1, 6),
    comboTimer: Math.max(0, finite(overrides.comboTimer, 0)),
    caught: nonNegativeInteger(overrides.caught),
    perks: normalizePerks(overrides.perks),
    stats: normalizeStats(overrides.stats),
    sound: overrides.sound !== false
  };
}

export function cloneGameState(state) {
  return createGameState({
    ...state,
    stones: Array.isArray(state?.stones) ? state.stones.map(stone => ({ ...stone })) : [],
    perks: { ...(state?.perks ?? {}) },
    stats: { ...(state?.stats ?? {}) }
  });
}

export function validateGameState(input) {
  const errors = [];
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { valid: false, errors: ["State must be an object."] };
  }
  if (!Array.isArray(input.stones)) errors.push("stones must be an array.");
  if (!Number.isInteger(input.levelIndex) || input.levelIndex < 0 || input.levelIndex >= LEVEL_DEFINITIONS.length) {
    errors.push(`levelIndex must be an integer between 0 and ${LEVEL_DEFINITIONS.length - 1}.`);
  }
  if (!Number.isFinite(input.score) || input.score < 0) errors.push("score must be a non-negative finite number.");
  if (!Number.isFinite(input.heat) || input.heat < 0 || input.heat > 100) errors.push("heat must be between 0 and 100.");
  if (!Number.isInteger(input.combo) || input.combo < 1 || input.combo > 6) errors.push("combo must be an integer between 1 and 6.");
  if (!input.perks || typeof input.perks !== "object") errors.push("perks must be an object.");
  if (!input.stats || typeof input.stats !== "object") errors.push("stats must be an object.");
  return { valid: errors.length === 0, errors };
}
