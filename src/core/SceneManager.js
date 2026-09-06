export class SceneManager {
  constructor(options = {}) {
    this.events = options.events ?? null;
    this.scenes = new Map();
    this.activeId = null;
    this.activeScene = null;
    this.transitionVersion = 0;
    this.transitioning = false;
  }

  register(id, scene) {
    if (typeof id !== "string" || !id) throw new TypeError("Scene id must be a non-empty string.");
    if (!scene || typeof scene !== "object") throw new TypeError("Scene must be an object.");
    if (this.scenes.has(id)) throw new Error(`Scene already registered: ${id}`);
    this.scenes.set(id, scene);
    return () => this.unregister(id);
  }

  unregister(id) {
    if (id === this.activeId) throw new Error(`Cannot unregister active scene: ${id}`);
    return this.scenes.delete(id);
  }

  has(id) {
    return this.scenes.has(id);
  }

  get(id) {
    return this.scenes.get(id) ?? null;
  }

  async transitionTo(id, context = {}) {
    const nextScene = this.scenes.get(id);
    if (!nextScene) throw new Error(`Unknown scene: ${id}`);
    if (id === this.activeId && !context.force) return this.activeScene;

    const version = ++this.transitionVersion;
    const previousId = this.activeId;
    const previousScene = this.activeScene;
    let previousExited = false;
    let nextEntered = false;

    this.transitioning = true;
    this.events?.emit("scene:transition:start", { from: previousId, to: id });

    try {
      if (previousScene) {
        await previousScene.exit?.({ from: previousId, to: id, context });
        previousExited = true;
      }
      if (version !== this.transitionVersion) return null;

      await nextScene.enter?.({ from: previousId, to: id, context });
      nextEntered = true;
      if (version !== this.transitionVersion) {
        await nextScene.exit?.({ from: id, to: null, context: { cancelled: true } });
        return null;
      }

      this.activeId = id;
      this.activeScene = nextScene;
      this.events?.emit("scene:transition:complete", { from: previousId, to: id });
      return nextScene;
    } catch (error) {
      this.events?.emit("scene:transition:error", {
        from: previousId,
        to: id,
        message: error instanceof Error ? error.message : String(error)
      });

      if (nextScene !== previousScene) {
        try {
          await nextScene.exit?.({
            from: id,
            to: previousId,
            context: { failed: true, entered: nextEntered, error }
          });
        } catch {}
      }

      if (previousScene && previousExited) {
        try {
          await previousScene.enter?.({
            from: id,
            to: previousId,
            context: { rollback: true, error }
          });
        } catch {}
      }

      this.activeId = previousId;
      this.activeScene = previousScene;
      throw error;
    } finally {
      if (version === this.transitionVersion) this.transitioning = false;
    }
  }

  update(dt, time) {
    if (this.transitioning) return;
    this.activeScene?.update?.(dt, time);
  }

  render(alpha, metrics) {
    this.activeScene?.render?.(alpha, metrics);
  }

  async dispose() {
    this.transitionVersion++;
    const active = this.activeScene;
    const activeId = this.activeId;
    this.activeId = null;
    this.activeScene = null;
    this.transitioning = false;

    await active?.exit?.({ from: activeId, to: null, context: { dispose: true } });
    for (const scene of this.scenes.values()) await scene.dispose?.();
    this.scenes.clear();
  }
}
