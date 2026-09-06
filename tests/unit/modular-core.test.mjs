import test from "node:test";
import assert from "node:assert/strict";
import {
  EventBus,
  GameLoop,
  SceneManager,
  InputManager,
  AssetLoader,
  World,
  CollisionSystem,
  AnimationSystem,
  createAnimation,
  HybridRenderer,
  GameApp
} from "../../src/index.js";

test("EventBus podporuje once, unsubscribe a počty listenerů", () => {
  const events = new EventBus();
  const values = [];
  const unsubscribe = events.on("value", value => values.push(value));
  events.once("value", value => values.push(value * 10));

  assert.equal(events.listenerCount("value"), 2);
  assert.equal(events.emit("value", 2), 2);
  assert.equal(events.emit("value", 3), 1);
  unsubscribe();
  assert.equal(events.listenerCount("value"), 0);
  assert.deepEqual(values, [2, 20, 3]);
});

test("GameLoop používá fixed timestep a omezuje spiral of death", () => {
  const updates = [];
  const renders = [];
  const loop = new GameLoop({ fixedStep: 0.01, maxFrameDelta: 0.1, maxSubSteps: 3 });
  loop.addSystem((dt, time) => updates.push({ dt, time }));
  loop.addRenderer((alpha, metrics) => renders.push({ alpha, metrics }));

  const metrics = loop.advance(0.05);
  assert.equal(updates.length, 3);
  assert.equal(renders.length, 1);
  assert.equal(metrics.steps, 3);
  assert.ok(metrics.droppedTime > 0.019 && metrics.droppedTime < 0.021);
  assert.ok(metrics.alpha >= 0 && metrics.alpha < 1);
});

test("SceneManager zachovává pořadí enter, exit a update", async () => {
  const calls = [];
  const scenes = new SceneManager();
  scenes.register("menu", {
    enter: () => calls.push("menu:enter"),
    exit: () => calls.push("menu:exit"),
    update: () => calls.push("menu:update")
  });
  scenes.register("game", {
    enter: () => calls.push("game:enter"),
    update: () => calls.push("game:update"),
    render: () => calls.push("game:render")
  });

  await scenes.transitionTo("menu");
  scenes.update(1 / 60, 0);
  await scenes.transitionTo("game");
  scenes.update(1 / 60, 1 / 60);
  scenes.render(0.5, {});

  assert.deepEqual(calls, ["menu:enter", "menu:update", "menu:exit", "game:enter", "game:update", "game:render"]);
  assert.equal(scenes.activeId, "game");
});

test("InputManager rozlišuje pressed, down, released a reset", () => {
  const input = new InputManager();
  input.press("action");
  assert.deepEqual(input.action("action"), { down: true, pressed: true, released: false, value: 1 });
  input.endFrame();
  assert.deepEqual(input.action("action"), { down: true, pressed: false, released: false, value: 1 });
  input.release("action");
  assert.equal(input.action("action").released, true);
  input.setAxis("move", 2, 0);
  assert.deepEqual(input.axis("move"), { x: 1, y: 0, length: 1 });
  input.reset("test");
  assert.equal(input.action("action").down, false);
  assert.equal(input.axis("move"), 0);
});

test("AssetLoader deduplikuje souběžné načtení a po chybě umožní retry", async () => {
  const assets = new AssetLoader();
  let loads = 0;
  assets.register("json", async entry => {
    loads++;
    if (entry.fail && loads === 1) throw new Error("temporary");
    return { id: entry.id };
  });

  const entry = { id: "level", type: "json" };
  const [a, b] = await Promise.all([assets.load(entry), assets.load(entry)]);
  assert.equal(loads, 1);
  assert.strictEqual(a, b);

  loads = 0;
  const retryEntry = { id: "retry", type: "json", fail: true };
  await assert.rejects(assets.load(retryEntry), /temporary/);
  assert.deepEqual(await assets.load(retryEntry), { id: "retry" });
  assert.equal(loads, 2);
});

test("World vrací pouze entity se všemi požadovanými komponentami", () => {
  const world = new World();
  const player = world.createEntity({ transform: { x: 1, y: 2 }, velocity: { x: 3, y: 4 } });
  world.createEntity({ transform: { x: 5, y: 6 } });

  const rows = [...world.query("transform", "velocity")];
  assert.equal(rows.length, 1);
  assert.equal(rows[0][0], player);
  assert.deepEqual(rows[0][1], { x: 1, y: 2 });
  assert.equal(world.count("transform"), 2);
  assert.equal(world.destroyEntity(player), true);
  assert.equal(world.count(), 1);
});

test("CollisionSystem hlásí enter, stay a exit s kanonickým payloadem", () => {
  const events = new EventBus();
  const phases = [];
  const payloads = [];
  events.on("collision:enter", payload => { phases.push("enter"); payloads.push(payload); });
  events.on("collision:stay", payload => { phases.push("stay"); payloads.push(payload); });
  events.on("collision:exit", payload => { phases.push("exit"); payloads.push(payload); });

  const world = new World();
  const first = world.createEntity({ transform: { x: 0, y: 0 }, collider: { shape: "circle", radius: 10 } });
  const second = world.createEntity({ transform: { x: 15, y: 0 }, collider: { shape: "circle", radius: 10 } });
  const collisions = new CollisionSystem({ events, cellSize: 32 });

  assert.equal(collisions.update(world)[0].phase, "enter");
  assert.equal(collisions.update(world)[0].phase, "stay");
  world.patch(second, "transform", { x: 100 });
  assert.equal(collisions.update(world).length, 0);
  assert.deepEqual(phases, ["enter", "stay", "exit"]);
  assert.deepEqual(payloads[0], { a: first, b: second, normal: { x: 1, y: 0 }, depth: 5 });
  assert.deepEqual(payloads[2], { a: first, b: second });
});

test("AnimationSystem posouvá framy a dokončí non-loop animaci", () => {
  const system = new AnimationSystem();
  const looping = createAnimation({ frames: [0, 1], fps: 10 });
  assert.equal(system.updateAnimation(looping, 0.11), true);
  assert.equal(looping.frame, 1);
  system.updateAnimation(looping, 0.11);
  assert.equal(looping.frame, 0);

  const once = createAnimation({ frames: ["a", "b"], fps: 10, loop: false });
  system.updateAnimation(once, 0.25);
  assert.equal(once.frame, "b");
  assert.equal(once.completed, true);
  assert.equal(once.playing, false);
});

test("GameApp propojí scénu s fixed-step loopem a bezpečně se dispose", async () => {
  const calls = [];
  const app = new GameApp({ renderer: { render: () => calls.push("renderer"), dispose: () => calls.push("renderer:dispose") } });
  app.scenes.register("game", {
    enter: () => calls.push("enter"),
    update: () => calls.push("update"),
    render: () => calls.push("scene:render"),
    exit: () => calls.push("exit")
  });

  await app.boot("game");
  app.loop.advance(1 / 60);
  assert.deepEqual(calls.slice(0, 4), ["enter", "update", "scene:render", "renderer"]);
  await app.dispose();
  assert.ok(calls.includes("exit"));
  assert.ok(calls.includes("renderer:dispose"));
  assert.equal(app.disposed, true);
});

test("HybridRenderer vyžaduje explicitně injektovaný Three.js namespace", () => {
  assert.throws(() => new HybridRenderer({ canvas: {} }), /injected Three\.js namespace/);
});
