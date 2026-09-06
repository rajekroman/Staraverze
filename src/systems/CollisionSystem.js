const pairKey = (a, b) => a < b ? `${a}:${b}` : `${b}:${a}`;
const EPSILON = 1e-9;

const acceptsLayer = (mask, layer) => {
  if (mask === undefined || mask === null) return true;
  if (mask === "*") return true;
  const values = mask instanceof Set ? mask : new Set(Array.isArray(mask) ? mask : [mask]);
  return values.has("*") || values.has(layer ?? "default");
};

export function canLayersCollide(a, b) {
  const sourceA = a.source ?? a;
  const sourceB = b.source ?? b;
  const layerA = sourceA.layer ?? "default";
  const layerB = sourceB.layer ?? "default";
  return acceptsLayer(sourceA.mask, layerB) && acceptsLayer(sourceB.mask, layerA);
}

export function circleIntersectsCircle(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const radius = a.radius + b.radius;
  return dx * dx + dy * dy <= radius * radius;
}

export function aabbIntersectsAabb(a, b) {
  return Math.abs(a.x - b.x) * 2 <= a.width + b.width
    && Math.abs(a.y - b.y) * 2 <= a.height + b.height;
}

export function circleIntersectsAabb(circle, box) {
  const halfWidth = box.width / 2;
  const halfHeight = box.height / 2;
  const closestX = Math.max(box.x - halfWidth, Math.min(circle.x, box.x + halfWidth));
  const closestY = Math.max(box.y - halfHeight, Math.min(circle.y, box.y + halfHeight));
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  return dx * dx + dy * dy <= circle.radius * circle.radius;
}

export function colliderBounds(collider) {
  if (collider.shape === "circle") {
    return {
      minX: collider.x - collider.radius,
      minY: collider.y - collider.radius,
      maxX: collider.x + collider.radius,
      maxY: collider.y + collider.radius
    };
  }
  return {
    minX: collider.x - collider.width / 2,
    minY: collider.y - collider.height / 2,
    maxX: collider.x + collider.width / 2,
    maxY: collider.y + collider.height / 2
  };
}

export function intersects(a, b) {
  if (a.shape === "circle" && b.shape === "circle") return circleIntersectsCircle(a, b);
  if (a.shape === "aabb" && b.shape === "aabb") return aabbIntersectsAabb(a, b);
  if (a.shape === "circle") return circleIntersectsAabb(a, b);
  return circleIntersectsAabb(b, a);
}

function circleCircleContact(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const distance = Math.hypot(dx, dy);
  const depth = a.radius + b.radius - distance;
  if (depth < 0) return null;
  return {
    normal: distance > EPSILON ? { x: dx / distance, y: dy / distance } : { x: 1, y: 0 },
    depth
  };
}

function aabbAabbContact(a, b) {
  const overlapX = (a.width + b.width) / 2 - Math.abs(b.x - a.x);
  const overlapY = (a.height + b.height) / 2 - Math.abs(b.y - a.y);
  if (overlapX < 0 || overlapY < 0) return null;
  if (overlapX <= overlapY) {
    return { normal: { x: b.x >= a.x ? 1 : -1, y: 0 }, depth: overlapX };
  }
  return { normal: { x: 0, y: b.y >= a.y ? 1 : -1 }, depth: overlapY };
}

function circleAabbContact(circle, box) {
  const halfWidth = box.width / 2;
  const halfHeight = box.height / 2;
  const closestX = Math.max(box.x - halfWidth, Math.min(circle.x, box.x + halfWidth));
  const closestY = Math.max(box.y - halfHeight, Math.min(circle.y, box.y + halfHeight));
  let dx = closestX - circle.x;
  let dy = closestY - circle.y;
  let distance = Math.hypot(dx, dy);
  if (distance > circle.radius) return null;

  if (distance <= EPSILON) {
    const left = circle.x - (box.x - halfWidth);
    const right = box.x + halfWidth - circle.x;
    const bottom = circle.y - (box.y - halfHeight);
    const top = box.y + halfHeight - circle.y;
    const minimum = Math.min(left, right, bottom, top);
    if (minimum === left) ({ dx, dy, distance } = { dx: -1, dy: 0, distance: 0 });
    else if (minimum === right) ({ dx, dy, distance } = { dx: 1, dy: 0, distance: 0 });
    else if (minimum === bottom) ({ dx, dy, distance } = { dx: 0, dy: -1, distance: 0 });
    else ({ dx, dy, distance } = { dx: 0, dy: 1, distance: 0 });
    return { normal: { x: dx, y: dy }, depth: circle.radius + minimum };
  }

  return { normal: { x: dx / distance, y: dy / distance }, depth: circle.radius - distance };
}

export function collisionContact(a, b) {
  if (a.shape === "circle" && b.shape === "circle") return circleCircleContact(a, b);
  if (a.shape === "aabb" && b.shape === "aabb") return aabbAabbContact(a, b);
  if (a.shape === "circle") return circleAabbContact(a, b);
  const contact = circleAabbContact(b, a);
  return contact ? {
    normal: { x: -contact.normal.x, y: -contact.normal.y },
    depth: contact.depth
  } : null;
}

export class CollisionSystem {
  constructor(options = {}) {
    this.cellSize = options.cellSize ?? 128;
    this.events = options.events ?? null;
    this.filter = options.filter ?? (() => true);
    this.previousPairs = new Set();
    this.pairEntities = new Map();
    if (!(this.cellSize > 0)) throw new RangeError("cellSize must be greater than zero.");
  }

  worldCollider(entity, transform, collider) {
    const x = (transform.x ?? 0) + (collider.offsetX ?? 0);
    const y = (transform.y ?? 0) + (collider.offsetY ?? 0);
    if (collider.shape === "circle") {
      return { entity, shape: "circle", x, y, radius: collider.radius ?? 0, source: collider };
    }
    return {
      entity,
      shape: "aabb",
      x,
      y,
      width: collider.width ?? 0,
      height: collider.height ?? 0,
      source: collider
    };
  }

  update(world) {
    const colliders = [];
    for (const [entity, transform, collider] of world.query("transform", "collider")) {
      if (collider.enabled === false) continue;
      colliders.push(this.worldCollider(entity, transform, collider));
    }

    const grid = new Map();
    for (const collider of colliders) {
      const bounds = colliderBounds(collider);
      const minCellX = Math.floor(bounds.minX / this.cellSize);
      const maxCellX = Math.floor(bounds.maxX / this.cellSize);
      const minCellY = Math.floor(bounds.minY / this.cellSize);
      const maxCellY = Math.floor(bounds.maxY / this.cellSize);
      for (let cellY = minCellY; cellY <= maxCellY; cellY++) {
        for (let cellX = minCellX; cellX <= maxCellX; cellX++) {
          const key = `${cellX},${cellY}`;
          let bucket = grid.get(key);
          if (!bucket) grid.set(key, bucket = []);
          bucket.push(collider);
        }
      }
    }

    const checked = new Set();
    const currentPairs = new Set();
    const collisions = [];

    for (const bucket of grid.values()) {
      for (let i = 0; i < bucket.length; i++) {
        for (let j = i + 1; j < bucket.length; j++) {
          const a = bucket[i];
          const b = bucket[j];
          const key = pairKey(a.entity, b.entity);
          if (checked.has(key)) continue;
          checked.add(key);
          if (!canLayersCollide(a, b) || !this.filter(a, b)) continue;
          const contact = collisionContact(a, b);
          if (!contact) continue;

          currentPairs.add(key);
          this.pairEntities.set(key, { a: a.entity, b: b.entity });
          const phase = this.previousPairs.has(key) ? "stay" : "enter";
          const collision = { key, phase, a, b, normal: contact.normal, depth: contact.depth };
          collisions.push(collision);
          this.events?.emit(`collision:${phase}`, {
            a: a.entity,
            b: b.entity,
            normal: contact.normal,
            depth: contact.depth
          });
        }
      }
    }

    for (const key of this.previousPairs) {
      if (!currentPairs.has(key)) {
        const pair = this.pairEntities.get(key);
        if (pair) this.events?.emit("collision:exit", pair);
        this.pairEntities.delete(key);
      }
    }
    this.previousPairs = currentPairs;
    return collisions;
  }

  reset() {
    this.previousPairs.clear();
    this.pairEntities.clear();
  }
}
