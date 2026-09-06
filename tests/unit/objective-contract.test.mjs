import test from "node:test";
import assert from "node:assert/strict";
import { LEVEL_ORDER, getLevelDefinition, isLevelTargetReachable } from "../../src/data/levels.js";
import { evaluateObjective } from "../../src/gameplay/Objectives.js";

const scenarios = {
  chlum: {
    complete: { permit: true, digHits: 3, findings: 1 },
    premature: { permit: true, digHits: 2, findings: 1 }
  },
  nesmen: {
    complete: { permit: true, dug: 3, filled: 3, findings: 1 },
    premature: { permit: true, dug: 3, filled: 3, findings: 0 }
  },
  besednice: {
    complete: { clues: 3, hedgehog: true, bossStarted: true, bossDefeated: true },
    premature: { clues: 0, hedgehog: false, bossStarted: true, bossDefeated: true }
  },
  slavia: {
    complete: { papers: 3, expertConsulted: true, bossStarted: true, bossDefeated: true, certified: true, entered: true },
    premature: { papers: 3, expertConsulted: true, bossStarted: true, bossDefeated: true, certified: false, entered: true }
  }
};

for (const levelId of LEVEL_ORDER) {
  test(`${levelId}: valid flow completes the objective`, () => {
    assert.equal(evaluateObjective(levelId, scenarios[levelId].complete).complete, true);
  });

  test(`${levelId}: premature flow remains blocked`, () => {
    assert.equal(evaluateObjective(levelId, scenarios[levelId].premature).complete, false);
  });

  test(`${levelId}: every mandatory target exists and is reachable`, () => {
    const level = getLevelDefinition(levelId);
    for (const objective of level.objectives) {
      assert.equal(
        isLevelTargetReachable(levelId, objective.target, objective.required),
        true,
        `${objective.id} -> ${objective.target}`
      );
    }
  });
}
