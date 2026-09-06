export class EventBus {
  constructor(options = {}) {
    this.listeners = new Map();
    this.contracts = options.contracts ?? null;
    this.strict = options.strict ?? Boolean(this.contracts);
    this.validatePayload = options.validatePayload ?? null;
  }

  on(type, handler, options = {}) {
    if (typeof type !== "string" || !type) throw new TypeError("Event type must be a non-empty string.");
    if (typeof handler !== "function") throw new TypeError("Event handler must be a function.");

    let handlers = this.listeners.get(type);
    if (!handlers) {
      handlers = new Set();
      this.listeners.set(type, handlers);
    }
    handlers.add(handler);

    const unsubscribe = () => this.off(type, handler);
    if (options.signal) {
      if (options.signal.aborted) unsubscribe();
      else options.signal.addEventListener("abort", unsubscribe, { once: true });
    }
    return unsubscribe;
  }

  once(type, handler, options = {}) {
    let unsubscribe = null;
    const wrapped = payload => {
      unsubscribe?.();
      return handler(payload);
    };
    unsubscribe = this.on(type, wrapped, options);
    return unsubscribe;
  }

  off(type, handler) {
    const handlers = this.listeners.get(type);
    if (!handlers) return false;
    const removed = handlers.delete(handler);
    if (handlers.size === 0) this.listeners.delete(type);
    return removed;
  }

  emit(type, payload) {
    if (this.strict && !this.contracts?.[type]) throw new Error(`Unknown event type: ${type}`);
    if (this.contracts?.[type]) this.validatePayload?.(type, payload, this.contracts);

    const handlers = this.listeners.get(type);
    if (!handlers?.size) return 0;

    const errors = [];
    let delivered = 0;
    for (const handler of [...handlers]) {
      try {
        handler(payload);
        delivered++;
      } catch (error) {
        errors.push(error);
      }
    }

    if (errors.length === 1) throw errors[0];
    if (errors.length > 1) throw new AggregateError(errors, `Multiple handlers failed for event: ${type}`);
    return delivered;
  }

  clear(type) {
    if (typeof type === "string") return this.listeners.delete(type);
    const hadListeners = this.listeners.size > 0;
    this.listeners.clear();
    return hadListeners;
  }

  listenerCount(type) {
    return this.listeners.get(type)?.size ?? 0;
  }
}
