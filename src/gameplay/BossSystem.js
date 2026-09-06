const finiteNonNegative = (value, field) => {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new TypeError(`${field} must be a non-negative finite number.`);
  }
  return value;
};

const requireBoss = (world, entity) => {
  const boss = world?.get?.(entity, "boss");
  if (!boss || typeof boss !== "object") throw new TypeError("BossSystem requires a boss component.");
  return boss;
};

const setRecoveryInteraction = (world, entity, enabled) => {
  const interaction = world?.get?.(entity, "interaction");
  if (interaction?.kind === "recover") interaction.enabled = enabled === true;
};

export class BossSystem {
  start(world, entity) {
    const boss = requireBoss(world, entity);
    if (boss.defeated === true || boss.started === true) return false;
    boss.started = true;
    boss.state = "chasing";
    setRecoveryInteraction(world, entity, false);
    return true;
  }

  update(world, entity, targetEntity, dt) {
    const boss = requireBoss(world, entity);
    finiteNonNegative(dt, "Boss dt");
    if (boss.started !== true || boss.defeated === true) return this.snapshot(world, entity);

    const transform = world.get(entity, "transform");
    const target = world.get(targetEntity, "transform");
    if (!transform || !target) throw new TypeError("BossSystem requires boss and target transforms.");

    const dx = target.x - transform.x;
    const dy = target.y - transform.y;
    const distance = Math.hypot(dx, dy);
    const stopRange = finiteNonNegative(Number(boss.stopRange) || 0, "Boss stopRange");
    const speed = finiteNonNegative(Number(boss.speed) || 0, "Boss speed");

    if (dt === 0) {
      boss.state = distance <= stopRange ? "recoverable" : "chasing";
      setRecoveryInteraction(world, entity, boss.state === "recoverable");
      return this.snapshot(world, entity);
    }

    if (distance <= stopRange || distance === 0 || speed === 0) {
      boss.state = "recoverable";
      setRecoveryInteraction(world, entity, true);
      return this.snapshot(world, entity);
    }

    const travel = Math.min(speed * dt, Math.max(0, distance - stopRange));
    transform.x += dx / distance * travel;
    transform.y += dy / distance * travel;
    transform.rotation = Math.atan2(dy, dx);
    boss.state = distance - travel <= stopRange ? "recoverable" : "chasing";
    setRecoveryInteraction(world, entity, boss.state === "recoverable");

    const sprite = world.get(entity, "sprite");
    if (sprite && Math.abs(dx) > 0.001) sprite.flipX = dx < 0;
    return this.snapshot(world, entity);
  }

  defeat(world, entity) {
    const boss = requireBoss(world, entity);
    if (boss.started !== true || boss.defeated === true) return false;
    boss.defeated = true;
    boss.state = "defeated";
    setRecoveryInteraction(world, entity, false);
    return true;
  }

  reset(world, entity) {
    const boss = requireBoss(world, entity);
    boss.started = false;
    boss.defeated = false;
    boss.state = "inactive";
    setRecoveryInteraction(world, entity, false);
    return this.snapshot(world, entity);
  }

  snapshot(world, entity) {
    const boss = requireBoss(world, entity);
    const transform = world.get(entity, "transform");
    return {
      id: boss.id ?? entity,
      state: boss.state,
      started: boss.started === true,
      defeated: boss.defeated === true,
      x: transform?.x ?? null,
      y: transform?.y ?? null
    };
  }
}
