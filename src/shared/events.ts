type EventEmitterStackHandler = (...args: any[]) => any | Promise<any>
type EventStacks = Map<string, Set<EventEmitterStackHandler>>;

export class EventEmitter {
  private _eventStacks: EventStacks = new Map();
  static readonly Methods = [
    'on',
    'off',
    'addListener',
    'removeListener',
    'prependListener',
    'removeAllListeners',
    'emit',
    'eventNames',
    'listenerCount',
    'listeners'
  ];

  on(name: string, listener: EventEmitterStackHandler) {
    this.addListener(name, listener);
    return this;
  }

  off(name: string, listener: EventEmitterStackHandler) {
    this.removeListener(name, listener);
    return this;
  }

  addListener(name: string, listener: EventEmitterStackHandler) {
    if (!this._eventStacks.has(name)) {
      this._eventStacks.set(name, new Set());
    }
    (this._eventStacks.get(name) as Set<EventEmitterStackHandler>).add(listener);
    return this;
  }

  removeListener(name: string, listener: EventEmitterStackHandler) {
    const listeners = this.listeners(name);
    if (listeners && listeners.has(listener)) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this._eventStacks.delete(name);
      }
    }
  }

  removeAllListeners(name: string) {
    if (this._eventStacks.has(name)) {
      this._eventStacks.delete(name);
    }
  }

  async emit(name: string, ...args: any[]) {
    const listeners = this.listeners(name);
    if (!listeners) return;
    for (const [fn] of listeners.entries()) await fn(...args);
  }
  
  async sync(name: string, ...args: any[]) {
    const listeners = this.listeners(name);
    if (!listeners) return;
    await Promise.all(
      Array.from(listeners.values())
        .map(listener => Promise.resolve(listener(...args))));
  }
  
  async lookup(name: string, ...args: any[]) {
    const listeners = this.listeners(name);
    if (!listeners) return;
    const handlers = Array.from(listeners.values());
    let i = handlers.length;
    while (i--) await handlers[i](...args);
  }

  eventNames() {
    return Array.from(this._eventStacks.keys());
  }

  listenerCount(name: string) {
    const listeners = this.listeners(name);
    return listeners ? listeners.size : 0;
  }

  listeners(name: string) {
    if (!this._eventStacks.has(name)) return;
    return this._eventStacks.get(name);
  }
}