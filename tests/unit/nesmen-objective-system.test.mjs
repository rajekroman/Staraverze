import test from "node:test";
import assert from "node:assert/strict";
import { EventBus } from "../../src/core/EventBus.js";
import { EVENT_CONTRACTS, validateEventPayload } from "../../src/core/GameEvents.js";
import { createGameSession } from "../../src/gameplay/GameSession.js";
import { ObjectiveSystem } from "../../src/gameplay/ObjectiveSystem.js";
import { createNesmenFinding } from "../../src/data/nesmen.js";

const strictEvents = () => new EventBus({ contracts: EVENT_CONTRACTS, validatePayload: validateEventPayload });

test("Nesměň ObjectiveSystem requires permission, three dug and filled profiles, and one finding", () => {
  const events = strictEvents();
  const progress = [];
  const completed = [];
  const levels = [];
  const findings = [];
  events.on("objective:progress", payload => progress.push(payload));
  events.on("objective:complete", payload => completed.push(payload));
  events.on("level:complete", payload => levels.push(payload));
  events.on("finding:collected", payload => findings.push(payload));

  const session = createGameSession();
  session.enterLevel("nesmen");
  const objective = new ObjectiveSystem({ events, session, levelId: "nesmen" });

  assert.equal(objective.update({ dug: 3, filled: 3 }).complete, false);
  assert.equal(objective.grantPermission(), true);
  assert.equal(objective.grantPermission(), false);
  assert.equal(session.state.flags.nesmenPermission, true);

  const withoutFinding = objective.update({ dug: 3, filled: 3 });
  assert.equal(withoutFinding.complete, false);
  assert.equal(withoutFinding.text, "Vyzvedni nalezený vltavín");

  const finding = createNesmenFinding("nesmen-standard", "nesmen-finding-1");
  objective.recordFinding(finding);
  const result = objective.update({ dug: 3, filled: 3 });
  objective.update({ dug: 3, filled: 3 });

  assert.equal(result.complete, true);
  assert.equal(session.state.findings.length, 1);
  assert.equal(session.state.score, 120);
  assert.deepEqual(session.state.objective, {
    id: "nesmen-dig-and-restore",
    current: 3,
    required: 3,
    complete: true
  });
  assert.deepEqual(progress.at(-1), {
    id: "nesmen-dig-and-restore",
    current: 3,
    required: 3
  });
  assert.deepEqual(findings, [{
    findingId: "nesmen-finding-1",
    locality: "nesmen",
    rarity: "B",
    weight: 1.5,
    score: 120
  }]);
  assert.deepEqual(completed, [{ id: "nesmen-dig-and-restore", levelId: "nesmen" }]);
  assert.deepEqual(levels, [{ levelId: "nesmen", nextLevelId: "besednice", score: 120 }]);
  assert.throws(() => objective.recordFinding(finding), /already recorded/);
});
