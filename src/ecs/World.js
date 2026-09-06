export class World {
  constructor(options = {}) {
    this.events = options.events ?? null;
    this.nextEntityId = 1;
    this.entities = new Set();
    this.components = new Map();
  }

  createEntity(initialComponents = {}) {
    const entity = this.nextEntityId++;
    this.entities.add(entity);
    for (const [name, component] of Object.entries(initialComponents)) this.add(entity, name, component);
    this.events?.emit("entity:create", { entity });
    return entity;
  }

  destroyEntity(entity) {
    if (!this.entities.delete(entity)) return false;
    for (const store of this.components.values()) store.delete(entity);
    this.events?.emit("entity:destroy", { entity });
    return true;
  }

  assertEntity(entity) {
    if (!this.entities.has(entity)) throw new Error(`Unknown entity: ${entity}`);
  }

  store(name, create = false) {
    let store = this.components.get(name);
    if (!store && create) {
      store = new Map();
      this.components.set(name, store);
    }
    return store ?? null;
  }

  add(entity, name, component = true) {
    this.assertEntity(entity);
    if (typeof name !== "string" || !name) throw new TypeError("Component name must be a non-empty string.");
    this.store(name, true).set(entity, component);
    this.events?.emit("component:add", { entity, name, component });
    return component;
  }

  remove(entity, name) {
    const store = this.store(name);
    if (!store?.has(entity)) return false;
    const component = store.get(entity);
    store.delete(entity);
    if (store.size === 0) this.components.delete(name);
    this.events?.emit("component:remove", { entity, name, component });
    return true;
  }

  get(entity, name) {
    return this.store(name)?.get(entity);
  }

  has(entity, name) {
    return this.store(name)?.has(entity) ?? false;
  }

  patch(entity, name, values) {
    const current = this.get(entity, name);
    if (current === undefined) throw new Error(`Entity ${entity} has no component: ${name}`);
    if (current && typeof current === "object" && !Array.isArray(current)) {
      Object.assign(current, values);
      return current;
    }
    this.add(entity, name, values);
    return values;
  }

  *query(...names) {
    if (names.length === 0) {
      for (const entity of this.entities) yield [entity];
      return;
    }

    const stores = names.map(name => this.store(name));
    if (stores.some(store => !store)) return;
    const smallest = stores.reduce((best, store) => store.size < best.size ? store : best);

    for (const entity of smallest.keys()) {
      if (stores.every(store => store.has(entity))) {
        yield [entity, ...stores.map(store => store.get(entity))];
      }
    }
  }

  count(...names) {
    if (!names.length) return this.entities.size;
    let count = 0;
    for (const _ of this.query(...names)) count++;
    return count;
  }

  clear() {
    const count = this.entities.size;
    this.entities.clear();
    this.components.clear();
    this.events?.emit("world:clear", { count });
  }
}
