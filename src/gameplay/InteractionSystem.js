const finiteNumber = value => typeof value === "number" && Number.isFinite(value);

const distanceSquared = (a, b) => {
  const dx = (a.x ?? 0) - (b.x ?? 0);
  const dy = (a.y ?? 0) - (b.y ?? 0);
  return dx * dx + dy * dy;
};

export class InteractionSystem {
  constructor(options = {}) {
    this.events = options.events ?? null;
    this.currentTarget = null;
  }

  findAvailable(world, actor) {
    const actorTransform = world.get(actor, "transform");
    if (!actorTransform) return null;

    const candidates = [];
    for (const [entity, transform, interaction] of world.query("transform", "interaction")) {
      if (entity === actor || interaction?.enabled === false) continue;
      const range = interaction?.range;
      if (!finiteNumber(range) || range < 0) continue;
      if (typeof interaction.kind !== "string" || !interaction.kind) continue;
      if (typeof interaction.label !== "string" || !interaction.label) continue;

      const distanceSq = distanceSquared(actorTransform, transform);
      if (distanceSq > range * range) continue;
      candidates.push({
        entity,
        interaction,
        distanceSq,
        priority: finiteNumber(interaction.priority) ? interaction.priority : 0
      });
    }

    candidates.sort((a, b) => b.priority - a.priority || a.distanceSq - b.distanceSq || a.entity - b.entity);
    return candidates[0] ?? null;
  }

  update(world, actor, actionPressed = false) {
    const available = this.findAvailable(world, actor);
    const nextTarget = available?.entity ?? null;

    if (nextTarget !== this.currentTarget) {
      if (this.currentTarget !== null) this.events?.emit("interaction:cleared", { entity: this.currentTarget });
      this.currentTarget = nextTarget;
      if (available) {
        this.events?.emit("interaction:available", {
          entity: available.entity,
          kind: available.interaction.kind,
          label: available.interaction.label
        });
      }
    }

    if (!available) return null;
    const performed = actionPressed === true;
    if (performed) {
      this.events?.emit("interaction:performed", {
        actor,
        target: available.entity,
        kind: available.interaction.kind
      });
    }
    return { ...available, performed };
  }

  clear() {
    if (this.currentTarget === null) return false;
    const entity = this.currentTarget;
    this.currentTarget = null;
    this.events?.emit("interaction:cleared", { entity });
    return true;
  }
}
