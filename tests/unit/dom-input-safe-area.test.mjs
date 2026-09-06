import test from "node:test";
import assert from "node:assert/strict";
import { DomInputAdapter } from "../../src/input/DomInputAdapter.js";

class FakeEventTarget {
  constructor() {
    this.listeners = new Map();
  }

  addEventListener(type, handler) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(handler);
  }

  removeEventListener(type, handler) {
    this.listeners.get(type)?.delete(handler);
  }

  dispatch(type, event = {}) {
    event.type = type;
    event.target ??= this;
    for (const handler of this.listeners.get(type) ?? []) handler(event);
    return event;
  }
}

class FakeClassList {
  constructor() {
    this.values = new Set();
  }

  add(...names) { for (const name of names) this.values.add(name); }
  remove(...names) { for (const name of names) this.values.delete(name); }
  contains(name) { return this.values.has(name); }
}

class FakeStyle {
  constructor() {
    this.values = new Map();
    this.transform = "";
  }

  setProperty(name, value) { this.values.set(name, String(value)); }
  getPropertyValue(name) { return this.values.get(name) ?? ""; }
  removeProperty(name) { this.values.delete(name); }
}

class FakeElement extends FakeEventTarget {
  constructor(id, tagName = "DIV", bounds = { left: 0, top: 0, width: 128, height: 128 }) {
    super();
    this.id = id;
    this.tagName = tagName;
    this.bounds = bounds;
    this.classList = new FakeClassList();
    this.style = new FakeStyle();
    this.captured = new Set();
  }

  closest() {
    return ["BUTTON", "A", "INPUT", "TEXTAREA", "SELECT"].includes(this.tagName) ? this : null;
  }

  getBoundingClientRect() { return { ...this.bounds }; }
  setPointerCapture(pointerId) { this.captured.add(pointerId); }
  releasePointerCapture(pointerId) { this.captured.delete(pointerId); }
}

class FakeDocument extends FakeEventTarget {
  constructor() {
    super();
    this.hidden = false;
    this.documentElement = {
      clientWidth: 390,
      clientHeight: 844,
      style: new FakeStyle()
    };
    this.elements = new Map([
      ["moveZone", new FakeElement("moveZone")],
      ["stick", new FakeElement("stick")],
      ["actionButton", new FakeElement("actionButton", "BUTTON")],
      ["pauseButton", new FakeElement("pauseButton", "BUTTON")],
      ["menuButton", new FakeElement("menuButton", "BUTTON")]
    ]);
  }

  getElementById(id) { return this.elements.get(id) ?? null; }
}

class FakeWindow extends FakeEventTarget {
  constructor() {
    super();
    this.innerWidth = 390;
    this.innerHeight = 844;
    this.visualViewport = new FakeEventTarget();
    Object.assign(this.visualViewport, { width: 360, height: 700, offsetLeft: 10, offsetTop: 20 });
    this.timerId = 0;
    this.timers = new Map();
  }

  setTimeout(callback) {
    const id = ++this.timerId;
    this.timers.set(id, callback);
    return id;
  }

  clearTimeout(id) { this.timers.delete(id); }

  flushTimers() {
    const timers = [...this.timers.values()];
    this.timers.clear();
    for (const callback of timers) callback();
  }
}

class FakeInput {
  constructor() {
    this.actions = new Map();
    this.axes = new Map();
    this.resets = [];
    this.presses = [];
    this.releases = [];
  }

  ensureAction(name) {
    if (!this.actions.has(name)) this.actions.set(name, { down: false, value: 0 });
    return this.actions.get(name);
  }

  press(name, value = 1) {
    const action = this.ensureAction(name);
    action.down = true;
    action.value = value;
    this.presses.push(name);
  }

  release(name) {
    const action = this.ensureAction(name);
    action.down = false;
    action.value = 0;
    this.releases.push(name);
  }

  setAxis(name, x, y = null) {
    if (y === null) {
      this.axes.set(name, x);
      return x;
    }
    const length = Math.min(1, Math.hypot(x, y));
    const vector = { x, y, length };
    this.axes.set(name, vector);
    return vector;
  }

  action(name) { return this.ensureAction(name); }
  axis(name) { return this.axes.get(name) ?? 0; }

  reset(reason) {
    for (const action of this.actions.values()) {
      action.down = false;
      action.value = 0;
    }
    this.axes.clear();
    this.resets.push(reason);
  }
}

const event = properties => ({
  prevented: false,
  preventDefault() { this.prevented = true; },
  ...properties
});

function createAdapter() {
  const document = new FakeDocument();
  const window = new FakeWindow();
  const input = new FakeInput();
  let resizeCount = 0;
  const adapter = new DomInputAdapter({ input, document, window, onResize: () => { resizeCount += 1; } });
  return { adapter, document, window, input, resizeCount: () => resizeCount };
}

test("DomInputAdapter projects visual viewport gaps into the existing safe-area variables", () => {
  const { adapter, document, window, input, resizeCount } = createAdapter();
  const style = document.documentElement.style;

  assert.equal(style.getPropertyValue("--safe-t"), "max(env(safe-area-inset-top, 0px), 20px)");
  assert.equal(style.getPropertyValue("--safe-r"), "max(env(safe-area-inset-right, 0px), 20px)");
  assert.equal(style.getPropertyValue("--safe-b"), "max(env(safe-area-inset-bottom, 0px), 124px)");
  assert.equal(style.getPropertyValue("--safe-l"), "max(env(safe-area-inset-left, 0px), 10px)");
  assert.equal(style.getPropertyValue("--visual-viewport-width"), "360px");
  assert.equal(style.getPropertyValue("--visual-viewport-height"), "700px");

  window.visualViewport.height = 650;
  window.visualViewport.dispatch("resize", event({}));
  window.flushTimers();
  assert.equal(input.resets.at(-1), "visual-viewport-resize");
  assert.equal(resizeCount(), 1);
  assert.equal(style.getPropertyValue("--safe-b"), "max(env(safe-area-inset-bottom, 0px), 174px)");

  adapter.dispose();
  assert.equal(style.getPropertyValue("--safe-b"), "");
  assert.equal(style.getPropertyValue("--visual-viewport-height"), "");
});

test("DomInputAdapter owns joystick and action pointers until the matching global release", () => {
  const { adapter, document, window, input } = createAdapter();
  const moveZone = document.getElementById("moveZone");
  const action = document.getElementById("actionButton");
  const stick = document.getElementById("stick");

  moveZone.dispatch("pointerdown", event({ pointerId: 1, isPrimary: true, button: 0, clientX: 128, clientY: 64 }));
  assert.equal(input.axis("move").x, 1);
  assert.notEqual(stick.style.transform, "translate(-50%, -50%)");

  moveZone.dispatch("pointermove", event({ pointerId: 2, isPrimary: true, button: 0, clientX: 0, clientY: 64 }));
  assert.equal(input.axis("move").x, 1);
  window.dispatch("pointerup", event({ pointerId: 2 }));
  assert.equal(input.axis("move").x, 1);
  window.dispatch("pointercancel", event({ pointerId: 1 }));
  assert.equal(input.axis("move").length, 0);
  assert.equal(stick.style.transform, "translate(-50%, -50%)");

  action.dispatch("pointerdown", event({ pointerId: 5, isPrimary: false, button: 0 }));
  assert.equal(input.action("action").down, false);
  action.dispatch("pointerdown", event({ pointerId: 7, isPrimary: true, button: 0 }));
  assert.equal(input.action("action").down, true);
  assert.equal(action.classList.contains("active"), true);
  window.dispatch("pointerup", event({ pointerId: 8 }));
  assert.equal(input.action("action").down, true);
  window.dispatch("pointerup", event({ pointerId: 7 }));
  assert.equal(input.action("action").down, false);
  assert.equal(action.classList.contains("active"), false);

  adapter.dispose();
});

test("DomInputAdapter preserves native menu keyboard activation and resets on lifecycle changes", () => {
  const { adapter, document, window, input, resizeCount } = createAdapter();
  const menu = document.getElementById("menuButton");
  const action = document.getElementById("actionButton");
  const body = new FakeElement("body", "BODY");

  const menuEnter = window.dispatch("keydown", event({ code: "Enter", repeat: false, target: menu }));
  assert.equal(menuEnter.prevented, false);
  assert.equal(input.action("action").down, false);

  const gameplaySpace = window.dispatch("keydown", event({ code: "Space", repeat: false, target: body }));
  assert.equal(gameplaySpace.prevented, true);
  assert.equal(input.action("action").down, true);
  window.dispatch("keyup", event({ code: "Space", target: body }));
  assert.equal(input.action("action").down, false);

  const pressCount = input.presses.length;
  action.dispatch("click", event({ detail: 0, target: action }));
  assert.equal(input.presses.length, pressCount + 1);
  assert.equal(input.action("action").down, false);

  document.hidden = true;
  document.dispatch("visibilitychange", event({ target: document }));
  assert.equal(input.resets.at(-1), "document-hidden");
  document.hidden = false;

  window.dispatch("orientationchange", event({ target: window }));
  assert.equal(input.resets.at(-1), "orientation-change");
  window.flushTimers();
  assert.equal(resizeCount(), 1);

  adapter.dispose();
});
