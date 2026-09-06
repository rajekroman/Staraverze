import test from "node:test";
import assert from "node:assert/strict";
import { GameSession, createGameSession } from "../../src/gameplay/GameSession.js";

test("a new or reset session always starts at Chlum without persisted progress", () => {
  const session = createGameSession();
  assert.equal(session.state.levelId, "chlum");
  assert.equal(session.state.phase, "briefing");
  assert.equal(session.state.score, 0);
  assert.deepEqual(session.state.findings, []);

  session.enterLevel("besednice");
  session.recordFinding({ findingId: "b-1", locality: "besednice", rarity: "A", weight: 2.4, score: 120 });
  session.reset();

  assert.equal(session.state.levelId, "chlum");
  assert.equal(session.state.score, 0);
  assert.deepEqual(session.state.findings, []);
});

test("findings are copied and their scores add deterministically", () => {
  const session = new GameSession();
  const source = { findingId: "c-1", locality: "chlum", rarity: "b", weight: 1.25, score: 80 };

  session.recordFinding(source);
  source.findingId = "mutated";
  source.weight = 999;
  source.score = 999;
  session.recordFinding({ findingId: "n-1", locality: "nesmen", rarity: "A", weight: 2.5, score: 140 });

  assert.deepEqual(session.state.findings, [
    { findingId: "c-1", locality: "chlum", rarity: "B", weight: 1.25, score: 80 },
    { findingId: "n-1", locality: "nesmen", rarity: "A", weight: 2.5, score: 140 }
  ]);
  assert.equal(session.state.score, 220);
  assert.equal(Object.isFrozen(session.state), true);
  assert.equal(Object.isFrozen(session.state.findings), true);
  assert.equal(Object.isFrozen(session.state.findings[0]), true);
});

test("the session rejects duplicate or malformed findings", () => {
  const session = createGameSession();
  const finding = { findingId: "same", locality: "chlum", rarity: "C", weight: 0.8, score: 40 };
  session.recordFinding(finding);

  assert.throws(() => session.recordFinding(finding), /already recorded/);
  assert.throws(() => session.recordFinding({ ...finding, findingId: "bad", locality: "unknown" }), /Unknown finding locality/);
  assert.throws(() => session.recordFinding({ ...finding, findingId: "bad", rarity: "legendary" }), /Unknown finding rarity/);
  assert.throws(() => session.recordFinding({ ...finding, findingId: "bad-weight", weight: null }), /weight must be/);
  assert.throws(() => session.recordFinding({ ...finding, findingId: "bad-score", score: "40" }), /score must be/);
});

test("level transitions keep the session collection but reset level-local state", () => {
  const session = createGameSession();
  session.setPhase("playing");
  session.setDanger(75);
  session.setFlag("chlumPermission");
  session.setObjectiveProgress(1, true);
  session.recordFinding({ findingId: "c-2", locality: "chlum", rarity: "C", weight: 0.7, score: 30 });

  const next = session.enterNextLevel();
  assert.equal(next.levelId, "nesmen");
  assert.equal(next.phase, "briefing");
  assert.equal(next.danger, 0);
  assert.equal(next.objective.complete, false);
  assert.equal(next.score, 30);
  assert.equal(next.findings.length, 1);
  assert.equal(next.flags.chlumPermission, true);
});

test("GameSession has no persistence or inventory operations", () => {
  const names = Object.getOwnPropertyNames(GameSession.prototype);
  assert.equal(names.some(name => /save|load|storage|migrate|inventory/i.test(name)), false);
});
