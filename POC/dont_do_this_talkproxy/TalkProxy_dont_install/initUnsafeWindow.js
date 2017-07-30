(async function initUnsafeWindow() {
    const promise = initTalkProxy('sub', 'main');
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('talkProxy.bundle.js');
    script.setAttribute('onload', 'initTalkProxy("main", "sub")');
    document.documentElement.appendChild(script);
    return window.unsafeWindow = await promise;
}());