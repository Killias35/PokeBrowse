import { getVolumesParam } from './settingsUtils.js';

let Music = null;

export async function startMusic(type, loop = true, GLOBAL_MUSIC_VOLUME = .3) {
    stopMusic();
    let nbMusic = 4;
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

    const randomMusic = Math.floor(Math.random() * nbMusic);
    
    Music = new Audio(
        chrome.runtime.getURL(`assets/${path}/${randomMusic}.mp3`)
    );

    Music.loop = loop;
    Music.volume = GLOBAL_MUSIC_VOLUME *.1;

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