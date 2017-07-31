const runtime = (typeof browser === 'undefined' ? chrome : browser).runtime;
export const id = runtime.id;
export function injectPageScript({
    src,
    fromExt = false,
    code = ''
}) {
    return new Promise((res, rej) => {
        const script = document.createElement('script');
        script.setAttribute('data-extid', id);
        if (src) script.src = fromExt ? runtime.getURL(src) : src;
        else script.appendChild(document.createTextNode(code));
        script.addEventListener('load', e => {
            script.remove();
            res();
        }, false);
        script.addEventListener('error', e => {
            script.remove();
            rej(e);
        }, false);
        (document.head || document.documentElement).appendChild(script);
    });
}
