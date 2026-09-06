const collisionEntities = collision => [collision?.a?.entity ?? collision?.a, collision?.b?.entity ?? collision?.b];

export class DangerSystem {
  constructor(options = {}) {
    this.events = options.events ?? null;
    this.session = options.session;
    this.cooldownDuration = options.cooldownDuration ?? 1.2;
    this.recoveryPerSecond = options.recoveryPerSecond ?? 20;
    this.defaultDanger = options.defaultDanger ?? 100;
    this.cooldown = 0;

    if (!this.session?.setDanger || !this.session?.state) throw new TypeError("DangerSystem requires a GameSession.");
    for (const [name, value] of [["cooldownDuration", this.cooldownDuration], ["recoveryPerSecond", this.recoveryPerSecond], ["defaultDanger", this.defaultDanger]]) {
      if (!(typeof value === "number" && Number.isFinite(value) && value >= 0)) throw new TypeError(`${name} must be a non-negative finite number.`);
    }
  }

  update(world, actor, collisions = [], dt = 0) {
    if (!(typeof dt === "number" && Number.isFinite(dt) && dt >= 0)) throw new TypeError("Danger dt must be a non-negative finite number.");
    this.cooldown = Math.max(0, this.cooldown - dt);

    const collision = collisions.find(entry => collisionEntities(entry).includes(actor) && collisionEntities(entry).some(entity => entity !== actor && world.get(entity, "hazard")));
    if (collision) {
      const hazardEntity = collisionEntities(collision).find(entity => entity !== actor && world.get(entity, "hazard"));
      const hazard = world.get(hazardEntity, "hazard");
      const previous = this.session.state.danger;
      if (hazard?.enabled === false || this.cooldown > 0) {
        return { caught: false, hazard: hazardEntity, previous, current: previous };
      }
      const requested = hazard.danger ?? this.defaultDanger;
      const current = Math.max(previous, Math.max(0, Math.min(100, requested)));
      this.session.setDanger(current);
      if (current !== previous) this.events?.emit("danger:changed", { previous, current, cause: hazard.kind ?? "hazard" });
      this.events?.emit("danger:caught", { hazard: hazardEntity, consequence: hazard.consequence ?? "caught" });
      this.cooldown = this.cooldownDuration;
      return { caught: true, hazard: hazardEntity, consequence: hazard.consequence ?? "caught", previous, current };
    }

    const previous = this.session.state.danger;
    if (previous > 0 && this.recoveryPerSecond > 0 && dt > 0) {
      const current = Math.max(0, previous - this.recoveryPerSecond * dt);
      this.session.setDanger(current);
      if (current !== previous) this.events?.emit("danger:changed", { previous, current, cause: "recovery" });
      return { caught: false, previous, current };
    }
    return { caught: false, previous, current: previous };
  }

  reset() {
    this.cooldown = 0;
  }
}
