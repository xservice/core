export declare type ComposeNextCallback = (...args: any[]) => Promise<any>;
export declare type ComposeMiddleware<T = any> = (ctx: T, next: ComposeNextCallback) => any;
export declare type ComposedMiddleware<T = any> = (ctx: T, next?: ComposeNextCallback) => Promise<any>;
export declare function Compose<T = any>(middleware: ComposeMiddleware<T>[]): ComposedMiddleware<T>;
