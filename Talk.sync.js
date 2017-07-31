const talkTag = "Talk.sync.js by 8qwe24657913",
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
                    this._waiting[sender]();
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
