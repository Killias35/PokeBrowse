(async () => {
    const hunt = await import(chrome.runtime.getURL("js/hunt.js"));
    const sound = await import(chrome.runtime.getURL("js/sound.js"));
    const utils = await import(chrome.runtime.getURL("js/utils.js"));
    
})();