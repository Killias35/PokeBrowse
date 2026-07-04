import { getVolumesParam, getUsernameParam, getIdentifiantParam } from '../settingsUtils.js';
import { getSpawned } from '../API/spawn.js';
import { startBattle } from '../API/battle.js';

async function getCurrentDomainFromTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if(tab.url.startsWith("chrome-extension://")) return null;
  const hostname = new URL(tab.url).hostname;
  const domaine = hostname.replace("www.", "").replace("wwws.", "");
  return domaine;
}

let offscreenReady = false;

chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
    if (msg.action === "OFFSCREEN_READY") {
        offscreenReady = true;
    } 
    else if (msg.action === "setHunt") {
        // Le popup (ou content script) modifie l'état de la chasse
        const huntActive = msg.value;
        if (huntActive) {
            startMusic("hunt");
        } else {
            stopMusic();
        }
        chrome.storage.local.set({ huntActive });
    } 
    else if (msg.action === "START_BATTLE") {
        chrome.storage.local.set({ huntActive: false });
        
        const username = await getUsernameParam();
        const identifiant = await getIdentifiantParam();
        
        // On démarre le combat côté serveur
        await startBattle(identifiant, msg.pokemon.encounter_id);
        stopMusic();
    }
    else if(msg.action === "getSpawnedPokemon") {
        await getSpawnedPokemon();
    }
    // Indique à Chrome qu'on gère la réponse de manière asynchrone si besoin
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

    // On attend que l'offscreen signale qu'il est prêt
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
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

// Fonction utilitaire dédiée uniquement à vérifier l'état de la chasse
async function isHuntActive() {
    const result = await chrome.storage.local.get("huntActive");
    return result.huntActive || false;
}

async function startMusic(type) {
    try {
        await setupOffscreenDocument();
        const volumesParam = await getVolumesParam() || {};
        
        // Sécurisation des variables avec valeurs par défaut
        const volMusic = volumesParam.musicVolume !== undefined ? volumesParam.musicVolume : 1.0;
        const volGlobal = volumesParam.globalVolume !== undefined ? volumesParam.globalVolume : 1.0;
        const GLOBAL_MUSIC_VOLUME = volMusic * volGlobal;
        
        await chrome.runtime.sendMessage({ action: "PLAY_MUSIC", GLOBAL_MUSIC_VOLUME, type });
    } catch (error) {
        console.error("Erreur lancement musique:", error);
    }
}

async function stopMusic() {
    try {
        await chrome.runtime.sendMessage({ action: "STOP_MUSIC" });
    } catch (error) {
        console.error("Erreur arrêt musique:", error);
    }
}

async function getSpawnedPokemon() {
    // On lit l'état depuis le storage SANS relancer la musique
    const active = await isHuntActive();
    if (!active) return;

    const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true
    });

    if (!tabs || !tabs[0]?.id) return;
    const identifiant = await getIdentifiantParam();
    const domaineName = await getCurrentDomainFromTab();
    const ret = await getSpawned(identifiant, domaineName);
    if (ret.success === false) return;
    const spawned = ret.spawned;
    try {
        await chrome.tabs.sendMessage(tabs[0].id, {
            action: "spawnPokemon",
            spawned
        });
    } catch (error) {
        // Ignoré : le content script n'est pas actif sur cette page (ex: page de paramètres Chrome)
    }
}

// --- GESTION DES ALARMES ---

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === "pokemonSpawn") {
        await getSpawnedPokemon();

        // On recrée l'alarme avec un délai minimum pour éviter le spam (ex: min 0.3 min + random)
        const delay = 0.1; 
        chrome.alarms.create("pokemonSpawn", {
            delayInMinutes: delay
        });
    }
});

// À l'initialisation ou au réveil du Service Worker, on s'assure que l'alarme tourne
chrome.alarms.get("pokemonSpawn", (alarm) => {
    if (!alarm) {
        chrome.alarms.create("pokemonSpawn", { delayInMinutes: 0.1 });
    }
});