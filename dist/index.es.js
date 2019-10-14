import 'reflect-metadata';
import Monitor, { VPCExpection } from '@xservice/server';
import Router from '@xservice/radix';
import { Container } from 'inversify';

var NAMESPACE;
(function (NAMESPACE) {
    NAMESPACE["TARGET"] = "META.TARGET";
    NAMESPACE["METHOD"] = "META.METHOD";
    NAMESPACE["PARAMETER"] = "META.PARAMETER";
})(NAMESPACE || (NAMESPACE = {}));
class TargetMetadata {
    constructor() {
        this.stacks = new Map();
    }
    set(key, value) {
        this.stacks.set(key, value);
        return this;
    }
    get(key) {
        return this.stacks.get(key);
    }
    has(key) {
        return this.stacks.has(key);
    }
    static bind(target) {
        let meta;
        if (!Reflect.hasMetadata(NAMESPACE.TARGET, target)) {
            meta = new TargetMetadata();
            Reflect.defineMetadata(NAMESPACE.TARGET, meta, target);
        }
        else {
            meta = Reflect.getMetadata(NAMESPACE.TARGET, target);
        }
        return meta;
    }
}
class MethodMetadata {
    constructor() {
        this.stacks = new Map();
    }
    set(key, value) {
        this.stacks.set(key, value);
        return this;
    }
    get(key) {
        return this.stacks.get(key);
    }
    has(key) {
        return this.stacks.has(key);
    }
    static bind(target) {
        let meta;
        if (!Reflect.hasMetadata(NAMESPACE.METHOD, target)) {
            meta = new MethodMetadata();
            Reflect.defineMetadata(NAMESPACE.METHOD, meta, target);
        }
        else {
            meta = Reflect.getMetadata(NAMESPACE.METHOD, target);
        }
        return meta;
    }
}
class ParameterMetadata {
    constructor() {
        this.stacks = [];
    }
    set(index, callback) {
        this.stacks[index] = callback;
        return this;
    }
    exec(ctx) {
        return Promise.all(this.stacks.map(fn => {
            if (typeof fn === 'function')
                return Promise.resolve(fn(ctx));
            return Promise.resolve();
        }));
    }
    static bind(target) {
        let meta;
        if (!Reflect.hasMetadata(NAMESPACE.PARAMETER, target)) {
            meta = new ParameterMetadata();
            Reflect.defineMetadata(NAMESPACE.PARAMETER, meta, target);
        }
        else {
            meta = Reflect.getMetadata(NAMESPACE.PARAMETER, target);
        }
        return meta;
    }
}
function setStaticParameterMetaData(callback) {
    return (target, property, index) => {
        const clazz = target.constructor.prototype[property];
        const meta = ParameterMetadata.bind(clazz);
        meta.set(index, callback);
    };
}
function setDynamicParameterMetaData(callback) {
    return (...args) => {
        return (target, property, index) => {
            const clazz = target.constructor.prototype[property];
            const meta = ParameterMetadata.bind(clazz);
            meta.set(index, (ctx) => callback(ctx, ...args));
        };
    };
}
function setStaticTargetMetaData(key, value) {
    return target => {
        const meta = TargetMetadata.bind(target);
        meta.set(key, value);
    };
}
function setDynamicTargetMetaData(key, callback) {
    return (...args) => {
        return target => {
            const meta = TargetMetadata.bind(target);
            const value = meta.get(key);
            meta.set(key, callback(value, ...args));
        };
    };
}
function setStaticMethodMetaData(key, value) {
    return (target, property, descriptor) => {
        const meta = MethodMetadata.bind(descriptor.value);
        meta.set(key, value);
    };
}
function setDynamicMethodMetaData(key, callback) {
    return (...args) => {
        return (target, property, descriptor) => {
            const meta = MethodMetadata.bind(descriptor.value);
            const value = meta.get(key);
            meta.set(key, callback(value, ...args));
        };
    };
}
const vpc = {
    prefix: setDynamicTargetMetaData('router.prefix', (value, url = '/') => url),
    use: setDynamicTargetMetaData('router.prefix.middleware', middlewareParser),
    router: setDynamicMethodMetaData('router.method.router', (value, url = '/') => url),
    get: setDynamicMethodMetaData('router.method.get', (value, url = '/') => url),
    post: setDynamicMethodMetaData('router.method.post', (value, url = '/') => url),
    put: setDynamicMethodMetaData('router.method.put', (value, url = '/') => url),
    delete: setDynamicMethodMetaData('router.method.delete', (value, url = '/') => url),
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
    query: setDynamicParameterMetaData((ctx, key) => ctx.query[key]),
    param: setDynamicParameterMetaData((ctx, key) => ctx.params[key]),
    state: setDynamicParameterMetaData((ctx, ...args) => reduceData(ctx.state, ...args)),
};
function middlewareParser(value, ...args) {
    value = value || [];
    value.unshift(...args);
    return value;
}
function reduceData(data, ...keys) {
    return keys.reduce((object, key) => {
        if (object === undefined)
            return undefined;
        if (object[key])
            return object[key];
        return undefined;
    }, data);
}

function Compose(middleware) {
    if (!Array.isArray(middleware))
        throw new TypeError('Middleware stack must be an array!');
    for (const fn of middleware) {
        if (typeof fn !== 'function')
            throw new TypeError('Middleware must be composed of functions!');
    }
    /**
     * @param {Object} context
     * @return {Promise}
     * @api public
     */
    return (ctx, next) => {
        // last called middleware #
        let index = -1;
        return dispatch(0);
        function dispatch(i) {
            if (i <= index)
                return Promise.reject(new Error('next() called multiple times'));
            index = i;
            let fn = middleware[i];
            if (i === middleware.length)
                fn = next;
            if (!fn)
                return Promise.resolve();
            try {
                return Promise.resolve(fn(ctx, dispatch.bind(null, i + 1)));
            }
            catch (err) {
                return Promise.reject(err);
            }
        }
    };
}

class EventEmitter {
    constructor() {
        this._eventStacks = new Map();
    }
    on(name, listener) {
        this.addListener(name, listener);
        return this;
    }
    off(name, listener) {
        this.removeListener(name, listener);
        return this;
    }
    addListener(name, listener) {
        if (!this._eventStacks.has(name)) {
            this._eventStacks.set(name, new Set());
        }
        this._eventStacks.get(name).add(listener);
        return this;
    }
    removeListener(name, listener) {
        const listeners = this.listeners(name);
        if (listeners && listeners.has(listener)) {
            listeners.delete(listener);
            if (listeners.size === 0) {
                this._eventStacks.delete(name);
            }
        }
    }
    removeAllListeners(name) {
        if (this._eventStacks.has(name)) {
            this._eventStacks.delete(name);
        }
    }
    async emit(name, ...args) {
        const listeners = this.listeners(name);
        if (!listeners)
            return;
        for (const [fn] of listeners.entries())
            await fn(...args);
    }
    async sync(name, ...args) {
        const listeners = this.listeners(name);
        if (!listeners)
            return;
        await Promise.all(Array.from(listeners.values())
            .map(listener => Promise.resolve(listener(...args))));
    }
    async lookup(name, ...args) {
        const listeners = this.listeners(name);
        if (!listeners)
            return;
        const handlers = Array.from(listeners.values());
        let i = handlers.length;
        while (i--)
            await handlers[i](...args);
    }
    eventNames() {
        return Array.from(this._eventStacks.keys());
    }
    listenerCount(name) {
        const listeners = this.listeners(name);
        return listeners ? listeners.size : 0;
    }
    listeners(name) {
        if (!this._eventStacks.has(name))
            return;
        return this._eventStacks.get(name);
    }
}
EventEmitter.Methods = [
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

class Service extends EventEmitter {
    constructor(render, options = {}) {
        super();
        this.container = new Container();
        this.mounted = false;
        this.frameworkerRenderer = render;
        this.options = options;
        this.router = new Router({
            ignoreTrailingSlash: options.ignoreTrailingSlash,
            caseSensitive: options.caseSensitive,
            maxParamLength: options.maxParamLength,
            defaultRoute: ctx => {
                if (this.listenerCount('404') > 0)
                    return this.sync('404', ctx);
                else
                    throw new VPCExpection('cannot find the router.path of ' + ctx.path, 404);
            },
        });
    }
    bind(target) {
        const targetMeta = Reflect.getMetadata(NAMESPACE.TARGET, target);
        const prefix = targetMeta ? targetMeta.get('router.prefix') : '/';
        const use = targetMeta ? targetMeta.get('router.prefix.middleware') : [];
        const properties = Object.getOwnPropertyNames(target.prototype);
        const isInversify = Reflect.hasMetadata('inversify:paramtypes', target);
        const clazzName = target.name;
        if (!clazzName && isInversify)
            throw new Error('miss class name.');
        for (let i = 0; i < properties.length; i++) {
            const property = properties[i];
            const that = target.prototype[property];
            if (property === 'constructor')
                continue;
            const methodMeta = Reflect.getMetadata(NAMESPACE.METHOD, that);
            if (methodMeta) {
                const methodPathes = [];
                if (methodMeta.has('router.method.router'))
                    methodPathes.push({ method: 'router', path: methodMeta.get('router.method.router') });
                if (methodMeta.has('router.method.get'))
                    methodPathes.push({ method: 'get', path: methodMeta.get('router.method.get') });
                if (methodMeta.has('router.method.post'))
                    methodPathes.push({ method: 'post', path: methodMeta.get('router.method.post') });
                if (methodMeta.has('router.method.put'))
                    methodPathes.push({ method: 'put', path: methodMeta.get('router.method.put') });
                if (methodMeta.has('router.method.delete'))
                    methodPathes.push({ method: 'delete', path: methodMeta.get('router.method.delete') });
                if (methodPathes.length > 1) {
                    console.warn('you cannot set multi vpc methods on ' + property + ' invokeing method.');
                    continue;
                }
                if (methodPathes.length === 1) {
                    const method = methodPathes[0].method;
                    const uri = methodPathes[0].path;
                    const middlewares = methodMeta.has('router.middleware') ? methodMeta.get('router.middleware') : [];
                    const tmpMiddleware = use.concat(middlewares);
                    tmpMiddleware.push(async (ctx, next) => {
                        const parameterMeta = Reflect.getMetadata(NAMESPACE.PARAMETER, that);
                        if (parameterMeta) {
                            const args = await parameterMeta.exec(ctx);
                            if (isInversify) {
                                const clazz = this.frameworkerRenderer.serviceInvoke(this.container.get(clazzName));
                                if (!clazz[property])
                                    throw new Error('cannot find the method of ' + property);
                                if (typeof clazz[property] === 'function') {
                                    ctx.body = await Promise.resolve(clazz[property](...args));
                                }
                            }
                            else {
                                const clazz = this.frameworkerRenderer.serviceInvoke(new target());
                                if (!clazz[property])
                                    throw new Error('cannot find the method of ' + property);
                                ctx.body = await Promise.resolve(clazz[property](...args));
                            }
                        }
                        else {
                            if (isInversify) {
                                const clazz = this.frameworkerRenderer.serviceInvoke(this.container.get(clazzName));
                                if (!clazz[property])
                                    throw new Error('cannot find the method of ' + property);
                                ctx.body = await Promise.resolve(clazz[property](ctx));
                            }
                            else {
                                const clazz = this.frameworkerRenderer.serviceInvoke(new target());
                                if (!clazz[property])
                                    throw new Error('cannot find the method of ' + property);
                                ctx.body = await Promise.resolve(clazz[property](ctx));
                            }
                        }
                        if (ctx.body && ctx.method === 'router') {
                            this.frameworkerRenderer.serviceRender(ctx.body);
                        }
                        await next();
                    });
                    const composed = Compose(tmpMiddleware);
                    const url = (prefix.endsWith('/') ? prefix.substring(0, -1) : prefix) + (!uri.startsWith('/') ? '/' + uri : uri);
                    this.router[method](url, ctx => composed(ctx));
                }
            }
        }
        isInversify && this.container.bind(target.name).to(target);
    }
    listen(mapState) {
        const createServer = Monitor({
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

export default Service;
export { Compose, EventEmitter, MethodMetadata, NAMESPACE, ParameterMetadata, TargetMetadata, setDynamicMethodMetaData, setDynamicParameterMetaData, setDynamicTargetMetaData, setStaticMethodMetaData, setStaticParameterMetaData, setStaticTargetMetaData, vpc };
