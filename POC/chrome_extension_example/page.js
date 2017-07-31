import Talk from './noConflict.js';

new Talk(`page`, (message, sender) => {
    // Do what you want
    console.log(`Page received "${message}" from ${sender}.`);
});
