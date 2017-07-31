const rollup = require('rollup');

rollup.rollup({
    entry: 'content.js'
}).then(bundle => bundle.write({
    format: 'cjs',
    dest: 'dist/content.bundle.js'
}));

rollup.rollup({
    entry: 'page.js'
}).then(bundle => bundle.write({
    format: 'iife',
    dest: 'dist/page.bundle.js'
}));
