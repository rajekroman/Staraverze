export {
  GAME_RUNTIME_VERSION,
  LEGACY_STATE_VERSION,
  SAVE_SCHEMA_VERSION,
  DEFAULT_STATS,
  createEmptyPerks,
  normalizePerks,
  normalizeStats,
  createGameState,
  cloneGameState,
  validateGameState
} from "../state/GameState.js";

export {
  CURRENT_SAVE_KEY,
  LEGACY_SAVE_KEYS,
  parseLegacySave,
  serializeLegacySave,
  readLegacySave,
  migrateLegacySave
} from "../adapters/LegacySaveAdapter.js";

export { evaluateObjective, isObjectiveComplete } from "../gameplay/Objectives.js";
