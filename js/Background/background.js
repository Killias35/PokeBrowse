import { getVolumesParam } from '../settingsUtils.js';

let creatingOffscreen;

const MaxTimeBeforeSpawn = 60 * 1000;  // 1 minutes, /2 = moyenne, 1 pokemon par 30 secondes
let setHunt = false;

let offscreenReady = false;


chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    if (msg.action === "OFFSCREEN_READY") {
      offscreenReady = true;
    }
    else if(msg.action === "setHunt") {
        setHunt = msg.value;

        if (setHunt) {
        startMusic("hunt");
        } else {
        stopMusic();
        }
    }
    else if (msg.action === "START_BATTLE") {
        chrome.storage.local.set({
            currentBattlePokemon: msg.pokemon
        });

        stopMusic();
    }
  })();

  return false;
});

async function setupOffscreenDocument() {
    const existing = await chrome.offscreen.hasDocument();
    if (existing) return;

    offscreenReady = false;

    await chrome.offscreen.createDocument({
        url: "html/offscreen.html",
        reasons: ["AUDIO_PLAYBACK"],
        justification: "Musique Pokémon"
    });

    await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            console.error("Offscreen jamais prêt — OFFSCREEN_READY non reçu");
            reject(new Error("Offscreen timeout"));
        }, 3000);

        const check = setInterval(() => {
            if (offscreenReady) {
                clearInterval(check);
                clearTimeout(timeout);
                resolve();
            }
        }, 50);
    });
}


async function getHunt() {
    if (!chrome.storage?.local) {
        console.error("chrome.storage.local indisponible");
        return;
    }
    const result = await chrome.storage.local.get("huntActive");
    setHunt = result.huntActive || false;

    if (setHunt) startMusic("hunt");
}

async function startMusic(type) {
    await setupOffscreenDocument();
    const volumesParam = await getVolumesParam();
    const GLOBAL_MUSIC_VOLUME = volumesParam.musicVolume * volumesParam.globalVolume;
    try {
      await chrome.runtime.sendMessage({ action: "PLAY_MUSIC", GLOBAL_MUSIC_VOLUME, type });
    } catch (error) {
        // console.error(error);
    }
}

async function stopMusic() {
    try {
      await chrome.runtime.sendMessage({ action: "STOP_MUSIC" });
    } catch (error) {
        // console.error(error);
    }
}

async function spawnPokemon() {
    const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
    });

    if (!tab?.id) return;

    try {
        await chrome.tabs.sendMessage(tab.id, {
            action: "spawnPokemon"
        });
    } catch (error) {
        // pas de hunt.js active
    }
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === "pokemonSpawn") {
        await spawnPokemon();

        chrome.alarms.create("pokemonSpawn", {
            delayInMinutes: Math.random()
        });
    }
});


getHunt();
chrome.alarms.create("pokemonSpawn", {
    delayInMinutes: 0.5
});