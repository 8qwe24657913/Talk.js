import Talk from '../../Talk.async.js';

const api = typeof browser === 'undefined' ? chrome : browser,
    id = api && api.runtime && api.runtime.id || document.currentScript.getAttribute('data-extid'),
    reg = new RegExp(`_${id}$`),
    addId = name => name.includes('_') ? name : `${name}_${id}`;

export default class TalkNoConflict extends Talk {
    constructor(name, handler) {
        super(addId(name), handler && function(message, sender) {
            return handler.call(this, message, sender.replace(reg, ''))
        });
    }
    ask(name, message) {
        return super.ask(addId(name), message);
    }
    tell(name, message) {
        return super.tell(addId(name), message);
    }
    wait(contact) {
        if (Array.isArray(contact)) return super.wait(contact.map(addId));
        return super.wait(addId(contact));
    }
}
