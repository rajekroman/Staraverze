import { createGameState, validateGameState } from "../state/GameState.js";

export const CURRENT_SAVE_KEY = "lovecVltavinuRebornSaveV5_1";
export const LEGACY_SAVE_KEYS = Object.freeze([
  "lovecVltavinuRebornSaveV5_0",
  "lovecVltavinuRebornSaveV4_9",
  "lovecVltavinuRebornSaveV4_8",
  "lovecVltavinuRebornSaveV4_7",
  "lovecVltavinuRebornSaveV4_6",
  "lovecVltavinuRebornSaveV4_5"
]);

function assertStorage(storage) {
  if (!storage || typeof storage.getItem !== "function" || typeof storage.setItem !== "function") {
    throw new TypeError("Storage must implement getItem() and setItem().");
  }
}

export function parseLegacySave(serialized) {
  if (typeof serialized !== "string" || !serialized.trim()) return null;
  const parsed = JSON.parse(serialized);
  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.stones)) return null;
  return createGameState(parsed);
}

export function serializeLegacySave(state) {
  const normalized = createGameState(state);
  const validation = validateGameState(normalized);
  if (!validation.valid) throw new Error(`Cannot serialize invalid game state: ${validation.errors.join(" ")}`);
  return JSON.stringify(normalized);
}

export function readLegacySave(storage, options = {}) {
  assertStorage(storage);
  const targetKey = options.targetKey ?? CURRENT_SAVE_KEY;
  const sourceKeys = [targetKey, ...(options.legacyKeys ?? LEGACY_SAVE_KEYS).filter(key => key !== targetKey)];

  for (const key of sourceKeys) {
    const serialized = storage.getItem(key);
    if (!serialized) continue;
    try {
      const state = parseLegacySave(serialized);
      if (!state) continue;
      return { key, state, serialized, migrated: key !== targetKey };
    } catch (error) {
      options.onInvalid?.({ key, serialized, error });
    }
  }
  return null;
}

export function migrateLegacySave(storage, options = {}) {
  assertStorage(storage);
  const targetKey = options.targetKey ?? CURRENT_SAVE_KEY;
  const existingTarget = storage.getItem(targetKey);

  if (existingTarget) {
    try {
      const state = parseLegacySave(existingTarget);
      if (state) return { key: targetKey, sourceKey: targetKey, state, migrated: false, written: false };
    } catch (error) {
      options.onInvalid?.({ key: targetKey, serialized: existingTarget, error });
    }
  }

  const found = readLegacySave(storage, {
    targetKey,
    legacyKeys: options.legacyKeys ?? LEGACY_SAVE_KEYS,
    onInvalid: options.onInvalid
  });
  if (!found) return null;

  storage.setItem(targetKey, serializeLegacySave(found.state));
  if (options.removeSource && found.key !== targetKey && typeof storage.removeItem === "function") {
    storage.removeItem(found.key);
  }

  return {
    key: targetKey,
    sourceKey: found.key,
    state: found.state,
    migrated: found.key !== targetKey,
    written: true
  };
}
