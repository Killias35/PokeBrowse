import { getVolumesParam } from './settingsUtils.js';

export let Music = null;
export let lastMusicIndex = null;

export async function startMusic(type, loop = true, GLOBAL_MUSIC_VOLUME = .3, i = null) {
    stopMusic();
    let nbMusic = 4;
    lastMusicIndex = i;
    let path = "routes";
    if (type === "hunt") {
        path = "routes";
        nbMusic = 4;
    }
    else if (type === "capture") {
        path = "fight";
        nbMusic = 0;
    }
    else if (type === "rare_capture") {
        path = "rare_fight";
        nbMusic = 0;
    }
    else if (type === "captured") {
        path = "captured";
        nbMusic = 0;
    }

    let randomMusic = Math.floor(Math.random() * nbMusic);
    if(lastMusicIndex) randomMusic = lastMusicIndex;

    Music = new Audio(
        chrome.runtime.getURL(`assets/${path}/${randomMusic}.mp3`)
    );

    Music.loop = loop;
    Music.volume = GLOBAL_MUSIC_VOLUME *.5;

    Music.play().catch(err => {
        console.error("Impossible de lancer la musique :", err);
        Music = null;
    });
}

export async function stopMusic() {
    if (!Music) return;

    Music.pause();
    Music.currentTime = 0;
    Music = null;
}