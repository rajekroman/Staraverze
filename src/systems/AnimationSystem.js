export function createAnimation(options = {}) {
  const frames = Array.isArray(options.frames) ? [...options.frames] : [];
  if (!frames.length) throw new Error("Animation requires at least one frame.");
  const fps = options.fps ?? 8;
  if (!(fps > 0)) throw new RangeError("Animation fps must be greater than zero.");
  return {
    clip: options.clip ?? "default",
    frames,
    fps,
    loop: options.loop !== false,
    playing: options.playing !== false,
    index: Math.max(0, Math.min(frames.length - 1, options.index ?? 0)),
    elapsed: Math.max(0, options.elapsed ?? 0),
    completed: false,
    frame: frames[Math.max(0, Math.min(frames.length - 1, options.index ?? 0))],
    motionDriven: options.motionDriven === true,
    motionThreshold: Math.max(0, Number(options.motionThreshold) || 0.001),
    resetOnIdle: options.resetOnIdle !== false,
    direction: options.direction ?? "down",
    directionFrames: options.directionFrames ?? null
  };
}

const resetAnimation = animation => {
  animation.index = 0;
  animation.elapsed = 0;
  animation.completed = false;
  animation.frame = animation.frames[0];
};

const resolveDirection = (x, y, fallback = "down") => {
  if (Math.abs(x) > Math.abs(y)) return x < 0 ? "left" : "right";
  if (Math.abs(y) > 0) return y > 0 ? "up" : "down";
  return fallback;
};

const selectDirectionalFrames = (animation, sprite, x, y) => {
  const directionFrames = animation.directionFrames;
  if (!directionFrames || typeof directionFrames !== "object") return false;
  const direction = resolveDirection(x, y, animation.direction);
  const frames = directionFrames[direction];
  if (!Array.isArray(frames) || frames.length === 0) return false;

  if (animation.direction !== direction || animation.frames !== frames) {
    animation.direction = direction;
    animation.frames = frames;
    animation.index = Math.min(animation.index, frames.length - 1);
    animation.frame = frames[animation.index];
  }
  sprite.flipX = false;
  return true;
};

export class AnimationSystem {
  constructor(options = {}) {
    this.events = options.events ?? null;
  }

  play(animation, options = {}) {
    if (!animation?.frames?.length) throw new TypeError("Invalid animation component.");
    if (options.restart) resetAnimation(animation);
    animation.completed = false;
    animation.playing = true;
    return animation;
  }

  pause(animation, options = {}) {
    if (!animation?.frames?.length) throw new TypeError("Invalid animation component.");
    animation.playing = false;
    if (options.reset === true) resetAnimation(animation);
    return animation;
  }

  setMotion(animation, sprite, move, options = {}) {
    if (!animation?.frames?.length) throw new TypeError("Invalid animation component.");
    if (!sprite || typeof sprite !== "object") throw new TypeError("Animation motion binding requires a sprite component.");
    const x = Number(move?.x) || 0;
    const y = Number(move?.y) || 0;
    const threshold = Math.max(0, Number(options.threshold) || 0.001);
    const moving = Math.hypot(x, y) >= threshold;

    const directional = moving && selectDirectionalFrames(animation, sprite, x, y);
    if (!directional && Math.abs(x) >= threshold) sprite.flipX = x < 0;
    if (moving) this.play(animation);
    else this.pause(animation, { reset: options.resetOnIdle !== false });
    sprite.frame = animation.frame;
    return moving;
  }

  updateAnimation(animation, dt, entity = null) {
    if (!animation.playing || animation.completed || animation.frames.length < 2) return false;
    const frameDuration = 1 / animation.fps;
    animation.elapsed += Math.max(0, dt);
    let changed = false;

    while (animation.elapsed >= frameDuration && animation.playing) {
      animation.elapsed -= frameDuration;
      if (animation.index < animation.frames.length - 1) {
        animation.index++;
      } else if (animation.loop) {
        animation.index = 0;
      } else {
        animation.index = animation.frames.length - 1;
        animation.completed = true;
        animation.playing = false;
        animation.elapsed = 0;
        this.events?.emit("animation:complete", { entity, clip: animation.clip });
      }
      animation.frame = animation.frames[animation.index];
      changed = true;
    }

    if (changed) this.events?.emit("animation:frame", {
      entity,
      clip: animation.clip,
      frame: animation.frame
    });
    return changed;
  }

  update(world, dt) {
    let changed = 0;
    for (const [entity, animation] of world.query("animation")) {
      const sprite = world.get(entity, "sprite");
      if (animation.motionDriven === true && sprite) {
        const transform = world.get(entity, "transform");
        const previous = world.get(entity, "previousTransform") ?? transform;
        this.setMotion(animation, sprite, {
          x: (transform?.x ?? 0) - (previous?.x ?? transform?.x ?? 0),
          y: (transform?.y ?? 0) - (previous?.y ?? transform?.y ?? 0)
        }, {
          threshold: animation.motionThreshold,
          resetOnIdle: animation.resetOnIdle
        });
      }
      const frameChanged = this.updateAnimation(animation, dt, entity);
      if (sprite && sprite.frame !== animation.frame) sprite.frame = animation.frame;
      if (frameChanged) changed++;
    }
    return changed;
  }
}
