import test from "node:test";
import assert from "node:assert/strict";
import { World } from "../../src/ecs/World.js";
import { BossSystem } from "../../src/gameplay/BossSystem.js";

const createWorld = () => {
  const world = new World();
  const player = world.createEntity({ transform: { x: 0, y: 0, rotation: 0 } });
  const boss = world.createEntity({
    transform: { x: 200, y: 0, rotation: 0 },
    sprite: { flipX: false },
    interaction: { kind: "recover", label: "ZÍSKAT ZPĚT", range: 74, enabled: false },
    boss: { id: "crystal-karel", state: "inactive", speed: 100, stopRange: 50, started: false, defeated: false }
  });
  return { world, player, boss };
};

test("BossSystem starts once and moves toward the player until recovery range", () => {
  const { world, player, boss } = createWorld();
  const system = new BossSystem();

  assert.equal(system.start(world, boss), true);
  assert.equal(system.start(world, boss), false);
  assert.equal(system.snapshot(world, boss).state, "chasing");

  const first = system.update(world, boss, player, 1);
  assert.equal(first.x, 100);
  assert.equal(first.state, "chasing");
  assert.equal(world.get(boss, "sprite").flipX, true);

  const second = system.update(world, boss, player, 1);
  assert.equal(second.x, 50);
  assert.equal(second.state, "recoverable");
  assert.equal(second.started, true);
  assert.equal(second.defeated, false);
});

test("BossSystem defeat is idempotent and disables recovery interaction", () => {
  const { world, player, boss } = createWorld();
  const system = new BossSystem();
  system.start(world, boss);
  world.get(boss, "interaction").enabled = true;
  system.update(world, boss, player, 2);

  assert.equal(system.defeat(world, boss), true);
  assert.equal(system.defeat(world, boss), false);
  assert.equal(world.get(boss, "interaction").enabled, false);
  assert.deepEqual(system.snapshot(world, boss), {
    id: "crystal-karel",
    state: "defeated",
    started: true,
    defeated: true,
    x: 50,
    y: 0
  });
});

test("BossSystem reset and validation preserve deterministic serializable state", () => {
  const { world, boss } = createWorld();
  const system = new BossSystem();
  system.start(world, boss);
  system.defeat(world, boss);
  assert.deepEqual(system.reset(world, boss), {
    id: "crystal-karel",
    state: "inactive",
    started: false,
    defeated: false,
    x: 200,
    y: 0
  });
  assert.equal(system.start(world, boss), true);
  assert.throws(() => system.update(world, boss, 999, 0.1), /transforms/);
  assert.throws(() => system.update(world, boss, boss, -1), /non-negative finite number/);
  const plain = world.createEntity({ transform: { x: 0, y: 0 } });
  assert.throws(() => system.start(world, plain), /boss component/);
});
