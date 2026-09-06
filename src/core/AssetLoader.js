const freezeEntry = entry => Object.freeze({ ...entry });
const preloadGroups = value => Array.isArray(value) ? value : [value];

export class AssetLoader {
  constructor(options = {}) {
    this.events = options.events ?? null;
    this.loaders = new Map();
    this.cache = new Map();
    this.manifest = new Map();
  }

  register(type, loader, disposer = null) {
    if (typeof type !== "string" || !type) throw new TypeError("Asset type must be a non-empty string.");
    if (typeof loader !== "function") throw new TypeError("Asset loader must be a function.");
    if (disposer !== null && typeof disposer !== "function") throw new TypeError("Asset disposer must be a function or null.");
    this.loaders.set(type, Object.freeze({ load: loader, dispose: disposer }));
    return () => this.loaders.delete(type);
  }

  key(entry) {
    if (!entry || typeof entry !== "object") throw new TypeError("Asset entry must be an object.");
    if (!entry.id || !entry.type) throw new Error("Asset entry requires id and type.");
    return `${entry.type}:${entry.id}`;
  }

  setManifest(entries) {
    if (!Array.isArray(entries)) throw new TypeError("Asset manifest must be an array.");
    const next = new Map();
    for (const source of entries) {
      const entry = freezeEntry(source);
      this.key(entry);
      if (next.has(entry.id)) throw new Error(`Duplicate asset manifest id: ${entry.id}`);
      if (!entry.url || typeof entry.url !== "string") throw new Error(`Asset ${entry.id} requires a URL.`);
      next.set(entry.id, entry);
    }
    this.manifest = next;
    return this.entries();
  }

  entries() {
    return [...this.manifest.values()];
  }

  entry(id) {
    return this.manifest.get(id) ?? null;
  }

  selectPreload(groups) {
    const requested = new Set(preloadGroups(groups).filter(group => typeof group === "string" && group));
    if (!requested.size) return [];
    return this.entries().filter(entry => preloadGroups(entry.preload).some(group => requested.has(group)));
  }

  preloadGroups(groups, options = {}) {
    return this.loadAll(this.selectPreload(groups), options);
  }

  preloadLevel(level, options = {}) {
    if (!level || !Array.isArray(level.assetGroups)) throw new TypeError("Level requires assetGroups for manifest preload.");
    return this.preloadGroups(level.assetGroups, options);
  }

  load(sourceEntry) {
    const entry = freezeEntry(sourceEntry);
    const key = this.key(entry);
    const cached = this.cache.get(key);
    if (cached) return cached.promise;

    const registration = this.loaders.get(entry.type);
    if (!registration) return Promise.reject(new Error(`No loader registered for asset type: ${entry.type}`));

    this.events?.emit("asset:load:start", { id: entry.id, type: entry.type });
    const record = {
      entry,
      disposer: registration.dispose,
      promise: null
    };
    record.promise = Promise.resolve()
      .then(() => registration.load(entry))
      .then(asset => {
        this.events?.emit("asset:load:complete", { id: entry.id, type: entry.type });
        return asset;
      })
      .catch(error => {
        if (this.cache.get(key) === record) this.cache.delete(key);
        this.events?.emit("asset:load:error", {
          id: entry.id,
          type: entry.type,
          message: error instanceof Error ? error.message : String(error)
        });
        throw error;
      });

    this.cache.set(key, record);
    return record.promise;
  }

  async loadAll(entries, options = {}) {
    if (!Array.isArray(entries)) throw new TypeError("Asset manifest selection must be an array.");
    const total = entries.length;
    let completed = 0;
    const result = new Map();

    await Promise.all(entries.map(async entry => {
      const asset = await this.load(entry);
      result.set(entry.id, asset);
      completed++;
      options.onProgress?.({ completed, total, ratio: total ? completed / total : 1, entry });
    }));

    return result;
  }

  get(id, type = null) {
    if (type) return this.cache.get(`${type}:${id}`)?.promise ?? null;
    const entry = this.entry(id);
    return entry ? this.cache.get(this.key(entry))?.promise ?? null : null;
  }

  has(id, type = null) {
    if (type) return this.cache.has(`${type}:${id}`);
    const entry = this.entry(id);
    return entry ? this.cache.has(this.key(entry)) : false;
  }

  cachedEntry(id, type = null) {
    const entry = type ? { id, type } : this.entry(id);
    return entry ? this.cache.get(this.key(entry))?.entry ?? null : null;
  }

  unload(id, type = null, disposer = null) {
    const entry = type ? { id, type } : this.entry(id);
    if (!entry) return false;
    const key = this.key(entry);
    const record = this.cache.get(key);
    if (!record) return false;
    this.cache.delete(key);
    const dispose = disposer ?? record.disposer;
    if (typeof dispose === "function") Promise.resolve(record.promise).then(asset => dispose(asset, record.entry)).catch(() => {});
    return true;
  }

  unloadOwned(entries, owner) {
    if (!entries || typeof entries[Symbol.iterator] !== "function") {
      throw new TypeError("Asset entries must be iterable.");
    }
    if (typeof owner !== "string" || !owner) throw new TypeError("Asset owner must be a non-empty string.");

    let unloaded = 0;
    for (const entry of entries) {
      if (entry?.disposeOwner !== owner) continue;
      if (this.unload(entry.id, entry.type)) unloaded++;
    }
    return unloaded;
  }

  clear(disposer = null) {
    const records = [...this.cache.values()];
    this.cache.clear();
    for (const record of records) {
      const dispose = disposer ?? record.disposer;
      if (typeof dispose === "function") Promise.resolve(record.promise).then(asset => dispose(asset, record.entry)).catch(() => {});
    }
  }
}
