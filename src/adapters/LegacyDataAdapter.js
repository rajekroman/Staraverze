import { LEVEL_DEFINITIONS } from "../data/levels.js";
import { PERK_DEFINITIONS } from "../data/perks.js";
import { SAMPLE_DEFINITIONS } from "../data/samples.js";
import { assertValidGameData } from "../data/validateGameData.js";

const freezeRows = rows => Object.freeze(rows.map(row => Object.freeze(row)));

export function createLegacyLevelTable(levels = LEVEL_DEFINITIONS) {
  return freezeRows(levels.map(level => ({
    id: level.id,
    name: level.name,
    title: level.title,
    theme: level.theme,
    text: level.text,
    goal: level.goal,
    music: level.music
  })));
}

export function createLegacyPerkTable(perks = PERK_DEFINITIONS) {
  return freezeRows(perks.map(perk => ({
    id: perk.id,
    icon: perk.icon,
    name: perk.name,
    text: perk.text,
    max: perk.max
  })));
}

export function createLegacySampleTable(samples = SAMPLE_DEFINITIONS) {
  return freezeRows(samples.map(sample => ({
    real: sample.real,
    title: sample.title,
    text: sample.text
  })));
}

export class LegacyDataAdapter {
  constructor(options = {}) {
    const levels = options.levels ?? LEVEL_DEFINITIONS;
    const perks = options.perks ?? PERK_DEFINITIONS;
    const samples = options.samples ?? SAMPLE_DEFINITIONS;

    assertValidGameData({ levels, perks, samples });
    this.levels = createLegacyLevelTable(levels);
    this.perks = createLegacyPerkTable(perks);
    this.samples = createLegacySampleTable(samples);
    Object.freeze(this);
  }

  snapshot() {
    return Object.freeze({
      LEVELS: this.levels,
      PERKS: this.perks,
      SAMPLES: this.samples
    });
  }

  install(target = globalThis, namespace = "LOVEC_GAME_DATA") {
    if (!target || (typeof target !== "object" && typeof target !== "function")) {
      throw new TypeError("Legacy data target must be an object.");
    }
    if (typeof namespace !== "string" || !namespace) {
      throw new TypeError("Legacy data namespace must be a non-empty string.");
    }

    const snapshot = this.snapshot();
    Object.defineProperty(target, namespace, {
      value: snapshot,
      writable: false,
      configurable: true,
      enumerable: false
    });
    return snapshot;
  }

  uninstall(target = globalThis, namespace = "LOVEC_GAME_DATA") {
    if (!target || !Object.prototype.hasOwnProperty.call(target, namespace)) return false;
    return delete target[namespace];
  }
}
