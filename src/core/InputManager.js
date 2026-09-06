const clamp = value => Math.max(-1, Math.min(1, Number(value) || 0));

export class InputManager {
  constructor(options = {}) {
    this.events = options.events ?? null;
    this.actions = new Map();
    this.axes = new Map();
    this.bindings = new Set();
    this.enabled = true;
  }

  ensureAction(name) {
    if (!this.actions.has(name)) {
      this.actions.set(name, { down: false, pressed: false, released: false, value: 0 });
    }
    return this.actions.get(name);
  }

  press(name, value = 1) {
    if (!this.enabled) return;
    const action = this.ensureAction(name);
    const nextValue = Math.max(0, Math.min(1, Number(value) || 0));
    if (!action.down) {
      action.down = true;
      action.pressed = true;
      this.events?.emit("input:pressed", { name, value: nextValue });
    }
    action.value = nextValue;
  }

  release(name) {
    const action = this.ensureAction(name);
    if (action.down) {
      action.down = false;
      action.released = true;
      this.events?.emit("input:released", { name, value: action.value });
    }
    action.value = 0;
  }

  setAxis(name, x, y = null, deadZone = 0.08) {
    if (!this.enabled) return;
    if (y === null) {
      const scalar = Math.abs(x) < deadZone ? 0 : clamp(x);
      this.axes.set(name, scalar);
      this.events?.emit("input:axis", { name, value: scalar });
      return scalar;
    }

    let nx = clamp(x);
    let ny = clamp(y);
    const length = Math.hypot(nx, ny);
    if (length < deadZone) {
      nx = 0;
      ny = 0;
    } else if (length > 1) {
      nx /= length;
      ny /= length;
    }
    const vector = Object.freeze({ x: nx, y: ny, length: Math.min(1, Math.hypot(nx, ny)) });
    this.axes.set(name, vector);
    this.events?.emit("input:axis", { name, value: vector });
    return vector;
  }

  action(name) {
    return this.actions.get(name) ?? { down: false, pressed: false, released: false, value: 0 };
  }

  axis(name) {
    return this.axes.get(name) ?? 0;
  }

  snapshot() {
    return {
      actions: Object.fromEntries([...this.actions].map(([name, state]) => [name, { ...state }])),
      axes: Object.fromEntries([...this.axes].map(([name, value]) => [name, typeof value === "object" ? { ...value } : value]))
    };
  }

  endFrame() {
    for (const action of this.actions.values()) {
      action.pressed = false;
      action.released = false;
    }
  }

  reset(reason = "manual") {
    for (const [name, action] of this.actions) {
      if (action.down) this.events?.emit("input:released", { name, value: action.value, reason });
      action.down = false;
      action.pressed = false;
      action.released = false;
      action.value = 0;
    }
    this.axes.clear();
    this.events?.emit("input:reset", { reason });
  }

  bindKeyboard(target, mapping) {
    if (!target?.addEventListener || !target?.removeEventListener) throw new TypeError("Keyboard target must be an EventTarget.");
    const resolve = code => mapping[code] ?? mapping.default?.(code) ?? null;
    const keydown = event => {
      const action = resolve(event.code);
      if (!action || event.repeat) return;
      event.preventDefault?.();
      this.press(action);
    };
    const keyup = event => {
      const action = resolve(event.code);
      if (!action) return;
      event.preventDefault?.();
      this.release(action);
    };
    target.addEventListener("keydown", keydown);
    target.addEventListener("keyup", keyup);
    const unbind = () => {
      target.removeEventListener("keydown", keydown);
      target.removeEventListener("keyup", keyup);
      this.bindings.delete(unbind);
    };
    this.bindings.add(unbind);
    return unbind;
  }

  dispose() {
    for (const unbind of [...this.bindings]) unbind();
    this.reset("dispose");
  }
}
