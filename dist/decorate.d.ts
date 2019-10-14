import 'reflect-metadata';
import { Context } from '@xservice/server';
export declare enum NAMESPACE {
    TARGET = "META.TARGET",
    METHOD = "META.METHOD",
    PARAMETER = "META.PARAMETER"
}
export declare class TargetMetadata {
    private readonly stacks;
    set(key: string, value: any): this;
    get(key: string): any;
    has(key: string): boolean;
    static bind(target: Function): TargetMetadata;
}
export declare class MethodMetadata {
    private readonly stacks;
    set(key: string, value: any): this;
    get(key: string): any;
    has(key: string): boolean;
    static bind<T>(target: T): MethodMetadata;
}
export declare class ParameterMetadata<T = {}> {
    private readonly stacks;
    set<U = any>(index: number, callback: (ctx: Context & T) => U | Promise<U>): this;
    exec(ctx: Context & T): Promise<any[]>;
    static bind<T>(target: Object): ParameterMetadata<T>;
}
export declare function setStaticParameterMetaData<T = {}, U = any>(callback: (ctx: Context & T) => U | Promise<U>): ParameterDecorator;
export declare function setDynamicParameterMetaData<T = {}, U = any>(callback: (ctx: Context & T, ...args: any[]) => U | Promise<U>): (...args: any[]) => ParameterDecorator;
export declare function setStaticTargetMetaData(key: string, value: any): ClassDecorator;
export declare function setDynamicTargetMetaData(key: string, callback: (...args: any[]) => any): (...args: any[]) => ClassDecorator;
export declare function setStaticMethodMetaData(key: string, value: any): MethodDecorator;
export declare function setDynamicMethodMetaData(key: string, callback: (...args: any[]) => any): (...args: any[]) => MethodDecorator;
export declare const vpc: {
    prefix: (...args: any[]) => ClassDecorator;
    use: (...args: any[]) => ClassDecorator;
    router: (...args: any[]) => MethodDecorator;
    get: (...args: any[]) => MethodDecorator;
    post: (...args: any[]) => MethodDecorator;
    put: (...args: any[]) => MethodDecorator;
    delete: (...args: any[]) => MethodDecorator;
    middleware: (...args: any[]) => MethodDecorator;
    ctx: ParameterDecorator;
    auth: ParameterDecorator;
    hash: ParameterDecorator;
    host: ParameterDecorator;
    hostname: ParameterDecorator;
    href: ParameterDecorator;
    origin: ParameterDecorator;
    password: ParameterDecorator;
    pathname: ParameterDecorator;
    port: ParameterDecorator;
    protocol: ParameterDecorator;
    slashes: ParameterDecorator;
    method: ParameterDecorator;
    username: ParameterDecorator;
    isApi: ParameterDecorator;
    querys: ParameterDecorator;
    states: ParameterDecorator;
    params: ParameterDecorator;
    referer: ParameterDecorator;
    path: ParameterDecorator;
    redirect: ParameterDecorator;
    replace: ParameterDecorator;
    reload: ParameterDecorator;
    vget: ParameterDecorator;
    vpost: ParameterDecorator;
    vput: ParameterDecorator;
    vdelete: ParameterDecorator;
    query: (...args: any[]) => ParameterDecorator;
    param: (...args: any[]) => ParameterDecorator;
    state: (...args: any[]) => ParameterDecorator;
};
