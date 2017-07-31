const talkTag = "Talk.async.js by 8qwe24657913",
    eventTarget = window;
export default class Talk {
    constructor(name, handler = () => {}) {
        this._name = String(name);
        if (!this._name) throw new Error('name must be a not empty string.');
        this._handler = handler;
        this._responses = {};
        this._contacts = [];
        this._waiting = {};
        this._greeted = false;
        eventTarget.addEventListener('message', (event) => {
            const info = event.data;
            if (event.source !== eventTarget || !info || info.talkTag !== talkTag) return;
            const sender = info.sender;
            if (info.sendTo ? info.sendTo !== this._name : sender === this._name) return;
            if (info.messageId === 0) { // greeting
                this._contacts.push(sender);
                if (info.needResponse) this._send({ // greeting back
                    messageId: 0,
                    sendTo: sender
                });
                if (this._waiting[sender]) { // for who waits sender
                    this._waiting[sender]();
                    this._waiting[sender] = null; // for garbage collection
                }
                return;
            }
            if (info.responseFor) return this._responses[info.responseFor](info); // info is a response
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
    ask(sendTo, message, transfer) {
        return this._send({
            sendTo,
            message,
            needResponse: true,
            transfer
        });
    }
    tell(sendTo, message, transfer) {
        return this._send({
            sendTo,
            message,
            transfer
        });
    }
    broadcast(message, transfer) {
        return this._send({
            message,
            transfer
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
        transfer,
        needResponse = false,
        responseFor = 0,
        error = null
    }) {
        const messageId = Math.random();
        eventTarget.postMessage({
            sender: this._name,
            sendTo,
            messageId,
            message,
            error,
            needResponse,
            responseFor,
            talkTag
        }, eventTarget.location.origin, transfer);
        if (!needResponse) return;
        return new Promise((resolve, reject) => {
            this._responses[messageId] = res => {
                this._responses[messageId] = null; // for garbage collection
                if (res.error) {
                    if (res.error.isError) {
                        const err = new Error(res.error.message);
                        err.stack = res.error.stack;
                        err.name = res.error.name;
                        return reject(err);
                    }
                    return reject(res.error.err);
                }
                resolve(res.message);
            };
        });
    }
}
