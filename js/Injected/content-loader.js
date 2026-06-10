(async () => {
    const hunt = await import(chrome.runtime.getURL("js/Injected/hunt.js"));
    const sound = await import(chrome.runtime.getURL("js/Injected/sound.js"));
    const utils = await import(chrome.runtime.getURL("js/Injected/utils.js"));
    
})();