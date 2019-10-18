import 'reflect-metadata';
import { MonitorEventListener, Context } from '@xservice/server';
import Router from '@xservice/radix';
import { Container, interfaces } from 'inversify';
import { TargetMetadata, MethodMetadata } from './decorate';
import { EventEmitter } from './shared/events';
export * from './decorate';
export * from './shared/compose';
export interface FrameworkerRenderer<T = {}> {
    serviceMount(): void;
    serviceInvoke(target: any): any;
    serviceRender(target: TargetMetadata, method: MethodMetadata, component: any): void;
    serviceMethodBinding?(meta: MethodMetadata): void;
    serviceTargetBinding?(meta: TargetMetadata): void;
    serviceContext?(ctx: Context & T): void | Promise<void>;
}
export declare type IServiceOptions = {
    prefix?: string;
    event?: MonitorEventListener;
    caseSensitive?: boolean;
    ignoreTrailingSlash?: boolean;
    maxParamLength?: number;
};
export { EventEmitter };
export default class Service<T = {}> extends EventEmitter {
    private readonly options;
    readonly router: Router<Context & T>;
    readonly container: Container;
    private readonly frameworkerRenderer;
    private mounted;
    constructor(render: FrameworkerRenderer<T>, options?: IServiceOptions);
    bind<U = any>(target: interfaces.Newable<U>): void;
    listen(mapState?: {
        [router: string]: string;
    }): void;
}
