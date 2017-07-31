import * as utils from './utils.js';
import Talk from './noConflict.js';

const id = utils.id,
    me = new Talk(`content`);
utils.injectPageScript({
    src: 'page.bundle.js',
    fromExt: true
}).then(() => {
    // Do what you want
    me.tell(`page`, 'Hello, page!');
});
