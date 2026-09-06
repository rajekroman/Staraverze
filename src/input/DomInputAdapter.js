const MOVE_KEYS = Object.freeze({
  ArrowLeft: [-1, 0], KeyA: [-1, 0],
  ArrowRight: [1, 0], KeyD: [1, 0],
  ArrowUp: [0, 1], KeyW: [0, 1],
  ArrowDown: [0, -1], KeyS: [0, -1]
});
const ACTION_KEYS = new Set(["Space", "Enter", "KeyE"]);
const PAUSE_KEYS = new Set(["Escape", "KeyP"]);
const SAFE_AREA_VARIABLES = Object.freeze({
  "--safe-t": "safe-area-inset-top",
  "--safe-r": "safe-area-inset-right",
  "--safe-b": "safe-area-inset-bottom",
  "--safe-l": "safe-area-inset-left"
});
const INTERACTIVE_SELECTOR = "button,a,input,textarea,select,[contenteditable='true'],[role='button']";

const clampGap = value => Math.max(0, Math.round((Number(value) || 0) * 100) / 100);
const px = value => `${clampGap(value)}px`;
const isPrimaryPointer = event => event?.isPrimary !== false && (event?.button === undefined || event.button === 0);
const isInteractiveTarget = target => {
  if (!target) return false;
  if (typeof target.closest === "function") return Boolean(target.closest(INTERACTIVE_SELECTOR));
  const tagName = String(target.tagName ?? "").toUpperCase();
  return ["BUTTON", "A", "INPUT", "TEXTAREA", "SELECT"].includes(tagName) || target.isContentEditable === true;
};

export class DomInputAdapter {
  constructor(options) {
    this.input = options.input;
    this.document = options.document;
    this.window = options.window;
    this.onResize = options.onResize ?? (() => {});
    this.keys = new Set();
    this.movePointer = null;
    this.actionPointer = null;
    this.resizeTimer = null;
    this.controller = new AbortController();
    this.root = this.document.documentElement ?? null;
    this.visualViewport = this.window.visualViewport ?? null;
    this.elements = {
      moveZone: this.require("moveZone"),
      stick: this.require("stick"),
      action: this.require("actionButton"),
      pause: this.require("pauseButton")
    };
    this.bind();
    this.syncSafeArea();
  }

  require(id) {
    const element = this.document.getElementById(id);
    if (!element) throw new Error(`Missing input element: #${id}`);
    return element;
  }

  listen(target, type, handler, options = {}) {
    if (!target?.addEventListener) return;
    target.addEventListener(type, handler, { ...options, signal: this.controller.signal });
  }

  bind() {
    const { moveZone, action, pause } = this.elements;

    this.listen(this.window, "keydown", event => {
      if (isInteractiveTarget(event.target)) return;
      if (MOVE_KEYS[event.code]) {
        event.preventDefault?.();
        this.keys.add(event.code);
        this.updateKeyboardAxis();
      } else if (ACTION_KEYS.has(event.code) && !event.repeat) {
        event.preventDefault?.();
        this.input.press("action");
      } else if (PAUSE_KEYS.has(event.code) && !event.repeat) {
        event.preventDefault?.();
        this.pulse("pause");
      }
    });
    this.listen(this.window, "keyup", event => {
      if (MOVE_KEYS[event.code]) {
        this.keys.delete(event.code);
        this.updateKeyboardAxis();
      } else if (ACTION_KEYS.has(event.code)) {
        this.input.release("action");
      }
    });

    this.listen(moveZone, "pointerdown", event => {
      if (!isPrimaryPointer(event) || this.movePointer !== null) return;
      event.preventDefault?.();
      this.movePointer = event.pointerId;
      try { moveZone.setPointerCapture?.(event.pointerId); } catch {}
      this.updatePointerAxis(event, moveZone);
    });
    this.listen(moveZone, "pointermove", event => {
      if (event.pointerId !== this.movePointer) return;
      event.preventDefault?.();
      this.updatePointerAxis(event, moveZone);
    });
    this.listen(moveZone, "pointerup", event => this.releaseMove(event));
    this.listen(moveZone, "pointercancel", event => this.releaseMove(event));
    this.listen(moveZone, "lostpointercapture", event => this.releaseMove(event));

    this.listen(action, "pointerdown", event => {
      if (!isPrimaryPointer(event) || this.actionPointer !== null) return;
      event.preventDefault?.();
      this.actionPointer = event.pointerId;
      try { action.setPointerCapture?.(event.pointerId); } catch {}
      action.classList.add("active");
      this.input.press("action");
    });
    this.listen(action, "pointerup", event => this.releaseAction(event));
    this.listen(action, "pointercancel", event => this.releaseAction(event));
    this.listen(action, "lostpointercapture", event => this.releaseAction(event));
    this.listen(action, "click", event => {
      if (event.detail !== 0) return;
      event.preventDefault?.();
      this.pulse("action");
    });

    this.listen(this.window, "pointerup", event => {
      this.releaseMove(event);
      this.releaseAction(event);
    });
    this.listen(this.window, "pointercancel", event => {
      this.releaseMove(event);
      this.releaseAction(event);
    });

    this.listen(pause, "click", event => {
      event.preventDefault?.();
      this.pulse("pause");
    });

    this.listen(this.window, "blur", () => this.reset("window-blur"));
    this.listen(this.document, "visibilitychange", () => {
      if (this.document.hidden) this.reset("document-hidden");
    });
    this.listen(this.window, "pagehide", () => this.clearDomState());
    this.listen(this.window, "orientationchange", () => {
      this.reset("orientation-change");
      this.scheduleViewportSync(80);
    });
    this.listen(this.window, "resize", () => this.scheduleViewportSync(0), { passive: true });
    this.listen(this.visualViewport, "resize", () => {
      this.reset("visual-viewport-resize");
      this.scheduleViewportSync(0);
    }, { passive: true });
    this.listen(this.visualViewport, "scroll", () => this.scheduleViewportSync(0), { passive: true });
  }

  pulse(name) {
    this.input.press(name);
    this.input.release(name);
  }

  releaseMove(event) {
    if (this.movePointer === null || event?.pointerId !== this.movePointer) return false;
    event.preventDefault?.();
    const pointerId = this.movePointer;
    this.movePointer = null;
    try { this.elements.moveZone.releasePointerCapture?.(pointerId); } catch {}
    this.input.setAxis("move", 0, 0);
    this.resetStick();
    return true;
  }

  releaseAction(event) {
    if (this.actionPointer === null || event?.pointerId !== this.actionPointer) return false;
    event.preventDefault?.();
    const pointerId = this.actionPointer;
    this.actionPointer = null;
    try { this.elements.action.releasePointerCapture?.(pointerId); } catch {}
    this.elements.action.classList.remove("active");
    this.input.release("action");
    return true;
  }

  updateKeyboardAxis() {
    let x = 0;
    let y = 0;
    for (const code of this.keys) {
      x += MOVE_KEYS[code]?.[0] ?? 0;
      y += MOVE_KEYS[code]?.[1] ?? 0;
    }
    this.input.setAxis("move", x, y);
  }

  updatePointerAxis(event, zone) {
    const bounds = zone.getBoundingClientRect();
    const radius = Math.max(1, Math.min(bounds.width, bounds.height) / 2);
    const x = (event.clientX - (bounds.left + bounds.width / 2)) / radius;
    const y = -((event.clientY - (bounds.top + bounds.height / 2)) / radius);
    const vector = this.input.setAxis("move", x, y);
    this.elements.stick.style.transform = `translate(calc(-50% + ${vector.x * radius * 0.45}px), calc(-50% + ${-vector.y * radius * 0.45}px))`;
  }

  resetStick() {
    this.elements.stick.style.transform = "translate(-50%, -50%)";
  }

  syncSafeArea() {
    const viewport = this.visualViewport;
    const layoutWidth = Math.max(0, Number(this.window.innerWidth) || Number(this.root?.clientWidth) || Number(viewport?.width) || 0);
    const layoutHeight = Math.max(0, Number(this.window.innerHeight) || Number(this.root?.clientHeight) || Number(viewport?.height) || 0);
    const width = Math.max(0, Number(viewport?.width) || layoutWidth);
    const height = Math.max(0, Number(viewport?.height) || layoutHeight);
    const left = clampGap(viewport?.offsetLeft);
    const top = clampGap(viewport?.offsetTop);
    const right = clampGap(layoutWidth - left - width);
    const bottom = clampGap(layoutHeight - top - height);
    const gaps = { top, right, bottom, left };

    if (this.root?.style?.setProperty) {
      const values = { "--safe-t": top, "--safe-r": right, "--safe-b": bottom, "--safe-l": left };
      for (const [variable, envName] of Object.entries(SAFE_AREA_VARIABLES)) {
        this.root.style.setProperty(variable, `max(env(${envName}, 0px), ${px(values[variable])})`);
      }
      this.root.style.setProperty("--visual-viewport-width", px(width));
      this.root.style.setProperty("--visual-viewport-height", px(height));
    }
    return Object.freeze({ width, height, ...gaps });
  }

  scheduleViewportSync(delay) {
    if (this.resizeTimer !== null) this.window.clearTimeout?.(this.resizeTimer);
    this.resizeTimer = this.window.setTimeout(() => {
      this.resizeTimer = null;
      this.syncSafeArea();
      this.onResize();
    }, delay);
  }

  clearDomState() {
    this.keys.clear();
    const movePointer = this.movePointer;
    const actionPointer = this.actionPointer;
    this.movePointer = null;
    this.actionPointer = null;
    if (movePointer !== null) {
      try { this.elements.moveZone.releasePointerCapture?.(movePointer); } catch {}
    }
    if (actionPointer !== null) {
      try { this.elements.action.releasePointerCapture?.(actionPointer); } catch {}
    }
    this.elements.action.classList.remove("active");
    this.resetStick();
  }

  reset(reason = "dom-reset") {
    this.clearDomState();
    this.input.reset(reason);
  }

  dispose() {
    this.controller.abort();
    if (this.resizeTimer !== null) this.window.clearTimeout?.(this.resizeTimer);
    this.resizeTimer = null;
    this.reset("dom-dispose");
    if (this.root?.style?.removeProperty) {
      for (const variable of Object.keys(SAFE_AREA_VARIABLES)) this.root.style.removeProperty(variable);
      this.root.style.removeProperty("--visual-viewport-width");
      this.root.style.removeProperty("--visual-viewport-height");
    }
  }
}
