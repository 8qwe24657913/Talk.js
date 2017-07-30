import Talk from '../../Talk.sync.js';
const toThing = new Map(),
    toInfo = new WeakMap(),
    obj = {},
    func = () => {},
    handlers = {};

function convertClonable(sth) {
    if (toInfo.has(sth)) return toInfo.get(sth);
    const type = typeof sth;
    if (type !== 'object' && type !== 'function' && sth !== document.all) return sth; // primitive
    const _proxy_id = Math.random();
    const info = {
        type,
        _proxy_id
    };
    toThing.set(_proxy_id, sth);
    toInfo.set(sth, info);
    return info;
}

function convertLocal(info) {
    if (typeof info !== 'object') return info; // primitive
    const {
        type,
        _proxy_id
    } = info;
    if (toThing.has(_proxy_id)) return toThing.get(_proxy_id);
    const proxy = new Proxy(type === 'object' ? obj : func, { // set up proxy
        info,
        __proto__: handlers
    });
    toInfo.set(proxy, info); // set up relation
    toThing.set(_proxy_id, proxy);
    return proxy;
}
export default function initTalkProxy(here, there) {
    const me = new Talk(here, ({
        key,
        args
    }) => convertClonable(Reflect[key](...args.map(convertLocal))));
    for (let key of Object.getOwnPropertyNames(Reflect)) {
        handlers[key] = function(target, ...args) {
            return convertLocal(me.ask(there, {
                key,
                args: [this.info, ...args.map(convertClonable)]
            }));
        }
    }
    if (here === 'main') {
        me.tell(there, convertClonable(window));
        return Promise.resolve();
    } else {
        return new Promise(res => {
            const talkHandler = me._handler;
            me._handler = function(win) {
                me._handler = talkHandler;
                res(convertLocal(win));
            }
        });
    }
}