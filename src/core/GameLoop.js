const TIME_EPSILON = 1e-9;
const defaultNow = () => globalThis.performance?.now?.() ?? Date.now();
const defaultRequestFrame = callback => {
  if (typeof globalThis.requestAnimationFrame === "function") return globalThis.requestAnimationFrame(callback);
  return globalThis.setTimeout(() => callback(defaultNow()), 16);
};
const defaultCancelFrame = handle => {
  if (typeof globalThis.cancelAnimationFrame === "function") globalThis.cancelAnimationFrame(handle);
  else globalThis.clearTimeout(handle);
};

export class GameLoop {
  constructor(options = {}) {
    this.fixedStep = options.fixedStep ?? 1 / 60;
    this.maxFrameDelta = options.maxFrameDelta ?? 0.1;
    this.maxSubSteps = options.maxSubSteps ?? 5;
    this.now = options.now ?? defaultNow;
    this.requestFrame = options.requestFrame ?? defaultRequestFrame;
    this.cancelFrame = options.cancelFrame ?? defaultCancelFrame;
    this.events = options.events ?? null;

    if (!(this.fixedStep > 0)) throw new RangeError("fixedStep must be greater than zero.");
    if (!(this.maxFrameDelta > 0)) throw new RangeError("maxFrameDelta must be greater than zero.");
    if (!Number.isInteger(this.maxSubSteps) || this.maxSubSteps < 1) throw new RangeError("maxSubSteps must be a positive integer.");

    this.systems = [];
    this.renderers = [];
    this.running = false;
    this.frameHandle = null;
    this.lastTimestamp = null;
    this.accumulator = 0;
    this.simulationTime = 0;
    this.totalFrames = 0;
    this.droppedTime = 0;
    this.boundFrame = timestamp => this.frame(timestamp);
  }

  addSystem(system, priority = 0) {
    const update = typeof system === "function" ? system : system?.update?.bind(system);
    if (typeof update !== "function") throw new TypeError("System must be a function or expose update(dt, time).");
    const entry = { source: system, update, priority };
    this.systems.push(entry);
    this.systems.sort((a, b) => a.priority - b.priority);
    return () => {
      const index = this.systems.indexOf(entry);
      if (index >= 0) this.systems.splice(index, 1);
    };
  }

  addRenderer(renderer, priority = 0) {
    const render = typeof renderer === "function" ? renderer : renderer?.render?.bind(renderer);
    if (typeof render !== "function") throw new TypeError("Renderer must be a function or expose render(alpha, metrics).");
    const entry = { source: renderer, render, priority };
    this.renderers.push(entry);
    this.renderers.sort((a, b) => a.priority - b.priority);
    return () => {
      const index = this.renderers.indexOf(entry);
      if (index >= 0) this.renderers.splice(index, 1);
    };
  }

  start() {
    if (this.running) return false;
    this.running = true;
    this.lastTimestamp = null;
    this.frameHandle = this.requestFrame(this.boundFrame);
    this.events?.emit("loop:start", this.metrics());
    return true;
  }

  stop() {
    if (!this.running) return false;
    this.running = false;
    if (this.frameHandle !== null) this.cancelFrame(this.frameHandle);
    this.frameHandle = null;
    this.lastTimestamp = null;
    this.events?.emit("loop:stop", this.metrics());
    return true;
  }

  frame(timestamp = this.now()) {
    if (!this.running) return;
    if (this.lastTimestamp === null) {
      this.lastTimestamp = timestamp;
      this.render(0, 0);
    } else {
      const delta = Math.max(0, (timestamp - this.lastTimestamp) / 1000);
      this.lastTimestamp = timestamp;
      this.advance(delta);
    }
    if (this.running) this.frameHandle = this.requestFrame(this.boundFrame);
  }

  advance(deltaSeconds) {
    const frameDelta = Math.min(Math.max(0, deltaSeconds), this.maxFrameDelta);
    this.accumulator += frameDelta;

    let steps = 0;
    while (this.accumulator + TIME_EPSILON >= this.fixedStep && steps < this.maxSubSteps) {
      for (const system of this.systems) system.update(this.fixedStep, this.simulationTime);
      this.simulationTime += this.fixedStep;
      this.accumulator = Math.max(0, this.accumulator - this.fixedStep);
      steps++;
    }

    const remainingWholeSteps = Math.floor((this.accumulator + TIME_EPSILON) / this.fixedStep);
    if (remainingWholeSteps > 0) {
      const dropped = remainingWholeSteps * this.fixedStep;
      this.droppedTime += dropped;
      this.accumulator = Math.max(0, this.accumulator - dropped);
      this.events?.emit("loop:drop", this.metrics({ frameDelta, steps, dropped }));
    }

    const alpha = Math.min(1, this.accumulator / this.fixedStep);
    this.totalFrames++;
    this.render(alpha, frameDelta, steps);
    return this.metrics({ alpha, frameDelta, steps });
  }

  render(alpha, frameDelta, steps = 0) {
    const metrics = this.metrics({ alpha, frameDelta, steps });
    for (const renderer of this.renderers) renderer.render(alpha, metrics);
  }

  reset() {
    this.lastTimestamp = null;
    this.accumulator = 0;
    this.simulationTime = 0;
    this.totalFrames = 0;
    this.droppedTime = 0;
  }

  metrics(extra = {}) {
    return {
      running: this.running,
      fixedStep: this.fixedStep,
      simulationTime: this.simulationTime,
      accumulator: this.accumulator,
      totalFrames: this.totalFrames,
      droppedTime: this.droppedTime,
      ...extra
    };
  }
}
