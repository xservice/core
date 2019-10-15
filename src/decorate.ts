import 'reflect-metadata';
import { Context } from '@xservice/server';
import { ComposeMiddleware } from './shared/compose';

export enum NAMESPACE {
  TARGET = 'META.TARGET',
  METHOD = 'META.METHOD',
  PARAMETER = 'META.PARAMETER',
}

export class TargetMetadata {
  private readonly stacks: Map<string, any> = new Map();

  set(key: string, value: any) {
    this.stacks.set(key, value);
    return this;
  }

  get<T = any>(key: string) {
    return this.stacks.get(key) as T;
  }

  has(key: string) {
    return this.stacks.has(key);
  }

  static bind(target: Function) {
    let meta: TargetMetadata;
    if (!Reflect.hasMetadata(NAMESPACE.TARGET, target)) {
      meta = new TargetMetadata();
      Reflect.defineMetadata(NAMESPACE.TARGET, meta, target);
    } else {
      meta = Reflect.getMetadata(NAMESPACE.TARGET, target) as TargetMetadata;
    }
    return meta;
  }
}

export class MethodMetadata {
  private readonly stacks: Map<string, any> = new Map();
  set(key: string, value: any) {
    this.stacks.set(key, value);
    return this;
  }

  get<T = any>(key: string) {
    return this.stacks.get(key) as T;
  }

  has(key: string) {
    return this.stacks.has(key);
  }

  static bind<T>(target: T) {
    let meta: MethodMetadata;
    if (!Reflect.hasMetadata(NAMESPACE.METHOD, target)) {
      meta = new MethodMetadata();
      Reflect.defineMetadata(NAMESPACE.METHOD, meta, target);
    } else {
      meta = Reflect.getMetadata(NAMESPACE.METHOD, target) as MethodMetadata;
    }
    return meta;
  }
}

export class ParameterMetadata<T = {}> {
  private readonly stacks: ((ctx: Context & T) => any | Promise<any>)[] = [];

  set<U = any>(index: number, callback: (ctx: Context & T) => U | Promise<U>) {
    this.stacks[index] = callback;
    return this;
  }

  exec(ctx: Context & T) {
    return Promise.all(this.stacks.map(fn => {
      if (typeof fn === 'function') return Promise.resolve(fn(ctx));
      return Promise.resolve();
    }));
  }

  static bind<T>(target: Object) {
    let meta: ParameterMetadata<T>;
    if (!Reflect.hasMetadata(NAMESPACE.PARAMETER, target)) {
      meta = new ParameterMetadata<T>();
      Reflect.defineMetadata(NAMESPACE.PARAMETER, meta, target);
    } else {
      meta = Reflect.getMetadata(NAMESPACE.PARAMETER, target) as ParameterMetadata<T>;
    }
    return meta;
  }
}

export function setStaticParameterMetaData<T = {}, U = any>(callback: (ctx: Context & T) => U | Promise<U>): ParameterDecorator {
  return (target, property, index) => {
    const clazz = target.constructor.prototype[property];
    const meta = ParameterMetadata.bind<T>(clazz);
    meta.set(index, callback);
  }
}

export function setDynamicParameterMetaData<T = {}, U = any>(callback: (ctx: Context & T, ...args: any[]) => U | Promise<U>) {
  return (...args: any[]): ParameterDecorator => {
    return (target, property, index) => {
      const clazz = target.constructor.prototype[property];
      const meta = ParameterMetadata.bind<T>(clazz);
      meta.set(index, (ctx) => callback(ctx, ...args));
    }
  }
}

export function setStaticTargetMetaData(key: string, value: any): ClassDecorator {
  return target => {
    const meta = TargetMetadata.bind(target);
    meta.set(key, value);
  }
}

export function setDynamicTargetMetaData(key: string, callback: (...args: any[]) => any) {
  return (...args: any[]): ClassDecorator => {
    return target => {
      const meta = TargetMetadata.bind(target);
      const value = meta.get(key);
      meta.set(key, callback(value, ...args));
    }
  }
}

export function setStaticMethodMetaData(key: string, value: any): MethodDecorator {
  return (target, property, descriptor) => {
    const meta = MethodMetadata.bind(descriptor.value);
    meta.set(key, value);
  }
}

export function setDynamicMethodMetaData(key: string, callback: (...args: any[]) => any) {
  return (...args: any[]): MethodDecorator => {
    return (target, property, descriptor) => {
      const meta = MethodMetadata.bind(descriptor.value);
      const value = meta.get(key);
      meta.set(key, callback(value, ...args));
    }
  }
}

export const vpc = {
  prefix: setDynamicTargetMetaData('router.prefix', (value, url: string = '/') => url),
  use: setDynamicTargetMetaData('router.prefix.middleware', middlewareParser),
  router: setDynamicMethodMetaData('router.method.router', (value, url: string = '/') => url),
  get: setDynamicMethodMetaData('router.method.get', (value, url: string = '/') => url),
  post: setDynamicMethodMetaData('router.method.post', (value, url: string = '/') => url),
  put: setDynamicMethodMetaData('router.method.put', (value, url: string = '/') => url),
  delete: setDynamicMethodMetaData('router.method.delete', (value, url: string = '/') => url),
  middleware: setDynamicMethodMetaData('router.middleware', middlewareParser),
  ctx: setStaticParameterMetaData(ctx => ctx),
  auth: setStaticParameterMetaData(ctx => ctx.auth),
  hash: setStaticParameterMetaData(ctx => ctx.hash),
  host: setStaticParameterMetaData(ctx => ctx.host),
  hostname: setStaticParameterMetaData(ctx => ctx.hostname),
  href: setStaticParameterMetaData(ctx => ctx.href),
  origin: setStaticParameterMetaData(ctx => ctx.origin),
  password: setStaticParameterMetaData(ctx => ctx.password),
  pathname: setStaticParameterMetaData(ctx => ctx.pathname),
  port: setStaticParameterMetaData(ctx => ctx.port),
  protocol: setStaticParameterMetaData(ctx => ctx.protocol),
  slashes: setStaticParameterMetaData(ctx => ctx.slashes),
  method: setStaticParameterMetaData(ctx => ctx.method),
  username: setStaticParameterMetaData(ctx => ctx.username),
  isApi: setStaticParameterMetaData(ctx => ctx.isApi),
  querys: setStaticParameterMetaData(ctx => ctx.query),
  states: setStaticParameterMetaData(ctx => ctx.state),
  params: setStaticParameterMetaData(ctx => ctx.params),
  referer: setStaticParameterMetaData(ctx => ctx.referer),
  path: setStaticParameterMetaData(ctx => ctx.path),
  redirect: setStaticParameterMetaData(ctx => ctx.redirect.bind(ctx)),
  replace: setStaticParameterMetaData(ctx => ctx.replace.bind(ctx)),
  reload: setStaticParameterMetaData(ctx => ctx.reload.bind(ctx)),
  vget: setStaticParameterMetaData(ctx => ctx.get.bind(ctx)),
  vpost: setStaticParameterMetaData(ctx => ctx.post.bind(ctx)),
  vput: setStaticParameterMetaData(ctx => ctx.put.bind(ctx)),
  vdelete: setStaticParameterMetaData(ctx => ctx.delete.bind(ctx)),
  query: setDynamicParameterMetaData((ctx, key: string) => ctx.query[key]),
  param: setDynamicParameterMetaData((ctx, key: string) => ctx.params[key]),
  state: setDynamicParameterMetaData((ctx, ...args) => reduceData(ctx.state, ...args)),
}

function middlewareParser(value: ComposeMiddleware[] | undefined | null, ...args: ComposeMiddleware[]) {
  value = value || [];
  value.unshift(...args);
  return value;
}

function reduceData(data: any, ...keys: (string | number)[]) {
  return keys.reduce((object, key) => {
    if (object === undefined) return undefined;
    if (object[key]) return object[key];
    return undefined;
  }, data);
}