
chrome.runtime.onMessage.addListener(async (message) => {
    switch (message.action) {
        case "PLAY_MUSIC": {
            const GLOBAL_MUSIC_VOLUME = message.GLOBAL_MUSIC_VOLUME;
            const { startMusic } = await import("../musique.js");
            await startMusic(message.type, true, GLOBAL_MUSIC_VOLUME);
            break;
        }
        case "RELOAD_MUSIC": {
            const GLOBAL_MUSIC_VOLUME = message.GLOBAL_MUSIC_VOLUME;
            const { startMusic, Music } = await import("../musique.js");
            if (Music) await startMusic(message.type, true, GLOBAL_MUSIC_VOLUME);
            break;
        }
        case "STOP_MUSIC": {
            const { stopMusic } = await import("../musique.js");
            await stopMusic();
            break;
        }
    }
});

chrome.runtime.sendMessage({ action: "OFFSCREEN_READY" });
