import test from "node:test";
import assert from "node:assert/strict";
import { SceneManager } from "../../src/core/SceneManager.js";

test("SceneManager restores the previous scene when the next enter fails", async () => {
  const calls = [];
  const scenes = new SceneManager();

  const field = {
    async enter(payload) { calls.push(["field:enter", payload.context]); },
    async exit(payload) { calls.push(["field:exit", payload.context]); }
  };
  const forest = {
    async enter() {
      calls.push(["forest:enter"]);
      throw new Error("asset failed");
    },
    async exit(payload) { calls.push(["forest:exit", payload.context]); }
  };

  scenes.register("field", field);
  scenes.register("forest", forest);
  await scenes.transitionTo("field", { initial: true });

  await assert.rejects(scenes.transitionTo("forest"), /asset failed/);

  assert.equal(scenes.activeId, "field");
  assert.equal(scenes.activeScene, field);
  assert.equal(scenes.transitioning, false);
  assert.deepEqual(calls.map(([name]) => name), [
    "field:enter",
    "field:exit",
    "forest:enter",
    "forest:exit",
    "field:enter"
  ]);
  assert.equal(calls.at(-1)[1].rollback, true);
});
