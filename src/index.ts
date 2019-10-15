import 'reflect-metadata';
import Monitor, { MonitorEventListener, Context, Methods, VPCExpection } from '@xservice/server';
import Router from '@xservice/radix';
import { Container, interfaces } from 'inversify';
import { NAMESPACE, TargetMetadata, MethodMetadata, ParameterMetadata } from './decorate';
import { ComposeMiddleware, Compose } from './shared/compose';
import { EventEmitter } from './shared/events';

export * from './decorate';
export * from './shared/compose';
export interface FrameworkerRenderer {
  serviceMount(): void;
  serviceInvoke(target: any): any;
  serviceRender(component: any): void;
  serviceBinding?(meta: MethodMetadata): void;
}

export type IServiceOptions = {
  prefix?: string,
  event?: MonitorEventListener,
  caseSensitive?: boolean;
  ignoreTrailingSlash?: boolean;
  maxParamLength?: number;
}

export {
  EventEmitter
}

export default class Service<T = {}> extends EventEmitter {
  private readonly options: IServiceOptions;
  public readonly router: Router<Context & T>;
  public readonly container = new Container();
  private readonly frameworkerRenderer: FrameworkerRenderer;
  private mounted: boolean = false;
  constructor(render: FrameworkerRenderer, options: IServiceOptions = {}) {
    super();
    this.frameworkerRenderer = render;
    this.options = options;
    this.router = new Router({
      ignoreTrailingSlash: options.ignoreTrailingSlash,
      caseSensitive: options.caseSensitive,
      maxParamLength: options.maxParamLength,
      defaultRoute: ctx => {
        if (this.listenerCount('404') > 0) return this.sync('404', ctx);
        else throw new VPCExpection('cannot find the router.path of ' + ctx.path, 404);
      },
    });
  }

  bind<U = any>(target: interfaces.Newable<U>) {
    const targetMeta = Reflect.getMetadata(NAMESPACE.TARGET, target) as TargetMetadata;
    const prefix = targetMeta ? targetMeta.get('router.prefix') as string : '/';
    const use = targetMeta ? targetMeta.get('router.prefix.middleware') as ComposeMiddleware[] : [];
    const properties = Object.getOwnPropertyNames(target.prototype);
    const isInversify = Reflect.hasMetadata('inversify:paramtypes', target);
    const clazzName = target.name;
    if (!clazzName && isInversify) throw new Error('miss class name.');
    for (let i = 0; i < properties.length; i++) {
      const property = properties[i];
      const that = target.prototype[property];
      if (property === 'constructor') continue;
      const methodMeta = Reflect.getMetadata(NAMESPACE.METHOD, that) as MethodMetadata;
      if (methodMeta) {
        const methodPathes: { method: Methods, path: string }[] = [];
        if (methodMeta.has('router.method.router')) methodPathes.push({ method: 'router', path: methodMeta.get('router.method.router') });
        if (methodMeta.has('router.method.get')) methodPathes.push({ method: 'get', path: methodMeta.get('router.method.get') });
        if (methodMeta.has('router.method.post')) methodPathes.push({ method: 'post', path: methodMeta.get('router.method.post') });
        if (methodMeta.has('router.method.put')) methodPathes.push({ method: 'put', path: methodMeta.get('router.method.put') });
        if (methodMeta.has('router.method.delete')) methodPathes.push({ method: 'delete', path: methodMeta.get('router.method.delete') });
        if (methodPathes.length > 1) {
          console.warn(
            'you cannot set multi vpc methods on ' 
            + property + 
            ' invokeing method.'
          );
          continue;
        }
        if (this.frameworkerRenderer.serviceBinding) {
          this.frameworkerRenderer.serviceBinding(methodMeta);
        }
        if (methodPathes.length === 1) {
          const method = methodPathes[0].method;
          const uri = methodPathes[0].path;
          const middlewares = methodMeta.has('router.middleware') 
            ? methodMeta.get('router.middleware') as ComposeMiddleware[] 
            : [];
          const tmpMiddleware = use.concat(middlewares);
          tmpMiddleware.push(async (ctx: Context & T, next) => {
            const parameterMeta = Reflect.getMetadata(NAMESPACE.PARAMETER, that) as ParameterMetadata<T>;
            if (parameterMeta) {
              const args = await parameterMeta.exec(ctx);
              if (isInversify) {
                const clazz = this.frameworkerRenderer.serviceInvoke(this.container.get<U>(clazzName));
                if (!clazz[property]) throw new Error('cannot find the method of ' + property);
                if (typeof clazz[property] === 'function') {
                  ctx.body = await Promise.resolve(clazz[property](...args));
                }
                
              } else {
                const clazz: any = this.frameworkerRenderer.serviceInvoke(new target());
                if (!clazz[property]) throw new Error('cannot find the method of ' + property);
                ctx.body = await Promise.resolve(clazz[property](...args));
              }
            } else {
              if (isInversify) {
                const clazz: any = this.frameworkerRenderer.serviceInvoke(this.container.get<U>(clazzName));
                if (!clazz[property]) throw new Error('cannot find the method of ' + property);
                ctx.body = await Promise.resolve(clazz[property](ctx));
              } else {
                const clazz: any = this.frameworkerRenderer.serviceInvoke(new target());
                if (!clazz[property]) throw new Error('cannot find the method of ' + property);
                ctx.body = await Promise.resolve(clazz[property](ctx));
              }
            }
            if (ctx.body && ctx.method === 'router') {
              this.frameworkerRenderer.serviceRender(ctx.body);
            }
            await next();
          });
          const composed = Compose<Context & T>(tmpMiddleware);
          const url = (prefix.endsWith('/') ? prefix.substring(0, -1) : prefix) + (!uri.startsWith('/') ? '/' + uri : uri);
          this.router[method](url, ctx => composed(ctx));
        }
      }
    }
    isInversify && this.container.bind<U>(target.name).to(target);
  }

  listen(mapState?: {
    [router: string]: string;
  }) {
    const createServer = Monitor<Context & T>({ 
      prefix: this.options.prefix,
      event: this.options.event,
      error: (err, ctx) => this.sync('error', err, ctx),
      start: ctx => this.sync('start', ctx),
      stop: ctx => this.sync('stop', ctx),
    });
    createServer(async (ctx) => {
      await this.router.lookup(ctx);
      if (!this.mounted && ctx.body) {
        this.frameworkerRenderer.serviceMount();
        this.mounted = true;
      }
    }).listen(mapState);
  }
}