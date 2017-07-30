var initTalkProxy = (function () {
'use strict';

const talkTag = "Talk.sync.js by 8qwe24657913";
const eventTarget = window;
class Talk {
    constructor(name, handler = () => {}) {
        this._name = String(name);
        if (!this._name) throw new Error('name must be a not empty string.');
        this._handler = handler;
        this._responses = {};
        this._contacts = [];
        this._waiting = {};
        this._greeted = false;
        eventTarget.addEventListener(talkTag, (event) => {
            const info = event.detail;
            if (!info) throw new Error(`Message can't be cloned. See: https://mdn.io/Structured_clone_algorithm`);
            const sender = info.sender;
            if (info.sendTo ? info.sendTo !== this._name : sender === this._name) return;
            event.preventDefault();
            if (info.messageId === 0) { // greeting
                this._contacts.push(sender);
                if (info.needResponse) this._send({ // greeting back
                    messageId: 0,
                    sendTo: sender
                });
                if (this._waiting[sender]) { // for who waits sender
                    this._waiting[sender](sender);
                    this._waiting[sender] = null; // for garbage collection
                }
                return;
            }
            if (info.responseFor) return this._responses[info.responseFor] = info; // info is a response
            let message, error;
            try {
                message = this._handler(info.message, sender);
            } catch (err) {
                if (typeof err === 'object' && err instanceof Error) error = { // error object can't be cloned
                    isError: true,
                    message: err.message,
                    stack: err.stack,
                    name: err.name
                };
                else error = {
                    isError: false,
                	err
                };
            }
            if (info.needResponse) this._send({
                sendTo: sender,
                message,
                error,
                responseFor: info.messageId
            });
        }, false);
    }
    ask(sendTo, message) {
        return this._send({
            sendTo,
            message,
            needResponse: true
        });
    }
    tell(sendTo, message) {
        return this._send({
            sendTo,
            message
        });
    }
    broadcast(message) {
        return this._send({
            message
        });
    }
    wait(contact) {
        if (Array.isArray(contact)) return Promise.all(contact.map(contact => this.wait(contact)));
        if (!this._greeted) this._greet();
        return new Promise(res => {
            if (this._contacts.includes(contact)) res();
            else this._waiting[contact] = res;
        });
    }
    greet() {
    	if (this._greeted) return;
        this._send({
            messageId: 0,
            needResponse: true
        });
        this._greeted = true;
    }
    _send({
        sendTo = false,
        message,
        needResponse = false,
        responseFor = false,
        error = null,
        messageId = Math.random()
    }) {
        const received = !eventTarget.dispatchEvent(new CustomEvent(talkTag, {
            bubbles: false,
            cancelable: true,
            detail: {
                sender: this._name,
                sendTo,
                messageId,
                message,
                error,
                needResponse,
                responseFor
            }
        }));
        if (messageId !== 0 && !received) console.warn(`Message isn't received, maybe ${sendTo} isn't initialized.`);
        if (!needResponse) return;
        const res = this._responses[messageId];
        this._responses[messageId] = null; // for garbage collection
        if (!res) throw new Error(`No response.`);
        if (res.error) {
            if (res.error.isError) {
                const err = new Error(res.error.message);
                err.stack = res.error.stack;
                err.name = res.error.name;
                throw err;
            }
            throw res.error.err;
        }
        return res.message;
    }
}

const toThing = new Map();
const toInfo = new WeakMap();
const obj = {};
const func = () => {};
const handlers = {};

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
function initTalkProxy(here, there) {
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
        };
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
            };
        });
    }
}

return initTalkProxy;

}());
