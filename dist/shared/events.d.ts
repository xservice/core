declare type EventEmitterStackHandler = (...args: any[]) => any | Promise<any>;
export declare class EventEmitter {
    private _eventStacks;
    static readonly Methods: string[];
    on(name: string, listener: EventEmitterStackHandler): this;
    off(name: string, listener: EventEmitterStackHandler): this;
    addListener(name: string, listener: EventEmitterStackHandler): this;
    removeListener(name: string, listener: EventEmitterStackHandler): void;
    removeAllListeners(name: string): void;
    emit(name: string, ...args: any[]): Promise<void>;
    sync(name: string, ...args: any[]): Promise<void>;
    lookup(name: string, ...args: any[]): Promise<void>;
    eventNames(): string[];
    listenerCount(name: string): number;
    listeners(name: string): Set<EventEmitterStackHandler> | undefined;
}
export {};
