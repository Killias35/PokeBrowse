
chrome.runtime.onMessage.addListener(async (message) => {
    switch (message.action) {
        case "PLAY_MUSIC": {
            const GLOBAL_MUSIC_VOLUME = message.GLOBAL_MUSIC_VOLUME;
            const { startMusic, stopMusic, lastMusicIndex } = await import("../musique.js");
            const i = lastMusicIndex;
            await stopMusic();
            await startMusic(message.type, true, GLOBAL_MUSIC_VOLUME, i);
            break;
        }
        case "RELOAD_MUSIC": {
            const GLOBAL_MUSIC_VOLUME = message.GLOBAL_MUSIC_VOLUME;
            const { startMusic, Music, lastMusicIndex } = await import("../musique.js");
            const i = lastMusicIndex;
            if (Music) await startMusic(message.type, true, GLOBAL_MUSIC_VOLUME, i);
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
