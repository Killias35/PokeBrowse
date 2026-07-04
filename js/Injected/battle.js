import { startEncounter, showSplashText, showScore, playCaptureSequence } from "./battle-annimation.js";
import { getPokeballs, usePokeball } from "./pokeballs.js";
import { playCry } from "./sound.js";
import { startMusic, stopMusic } from '../musique.js';
import { setHpStatus, triggerPokemonFlee, phaseChoixBall, phaseAffaiblissement, startCaptureMinigame} from "./battle-minigame.js";
import { startDodgeMinigame } from "./games/game-engine.js";
import { getVolumesParam } from "../settingsUtils.js";
import { getBattle, capture } from "../API/battle.js";
import { getIdentifiantParam } from "../settingsUtils.js";
import { getPokemon } from "./utils.js";

const Volumes = await getVolumesParam();
const GLOBAL_MUSIC_VOLUME = Volumes.musicVolume;

let POKEMON_FIGHTING = null; // Variable globale pour stocker le Pokémon en combat
let BATTLE_DATA = null; // Variable globale pour stocker les données du combat
let escapeAttempts = 0;
const DEFENSE_STAGE = document.getElementById("defense-stage");

// commun : 70% max de capture
// rare : 50% max de capture
// epic : 35% max de capture
// legendary : 20% max de capture
const RARITY_SETTINGS = {
    commun:     { resistence: 30, defenseDifficulty: 1, targetCPS: 8, duration: 1.6, targetSize: 80, pitchMax: 280, severity: 1},
    rare:       { resistence: 50, defenseDifficulty: 1.5, targetCPS: 10, duration: 1.0, targetSize: 100,  pitchMax: 380, severity: 1.5 },
    epic:       { resistence: 65, defenseDifficulty: 3, targetCPS: 12, duration: 0.5, targetSize: 125,  pitchMax: 450, severity: 3.5 },
    legendary:  { resistence: 80, defenseDifficulty: 4, targetCPS: 15, duration: 0.5, targetSize: 150,  pitchMax: 550, severity: 5 },
};

function calculateFleeSiccess(puissance, resistance) {
    const chance = resistance - puissance   // resistence de chance de fuite si pv 100%, 0% de chance de fuite si pv < resistence
    const roll = (Math.random() * 100).toFixed(2);
    const hasFled = roll <= chance;
    return hasFled;
}

async function startDefenseMinigame(pokemon, baseDifficulty) {
    DEFENSE_STAGE.classList.remove("hidden");
    escapeAttempts++; 
    // pokemon.types = ["fire"]; // DEBUG

    const types = pokemon.types;
    const activeType = types[Math.floor(Math.random() * types.length)];
    
    const rageMultiplier = 1 + (escapeAttempts * 0.5); 
    const difficulty = baseDifficulty * rageMultiplier;

    const minigameResult = await startDodgeMinigame(activeType, difficulty);

    DEFENSE_STAGE.classList.add("hidden");
    return minigameResult;
}

async function closeTabAfter20s() {
    const tab = await chrome.tabs.getCurrent();

    if (!tab?.id) return;
    setTimeout(() => {
        chrome.tabs.remove(tab.id);
    }, 20000);
}

async function lancerSequenceCapture() {
    const config = RARITY_SETTINGS[POKEMON_FIGHTING.rarity];
    const baseDifficulty = config.defenseDifficulty;
    while (true) {
        setHpStatus(100, true);
        // while (true) {await startDefenseMinigame(POKEMON_FIGHTING, baseDifficulty); await showSplashText("Retour au combat !", 1000);}   // DEBUG
        const ballChoisie = await phaseChoixBall();

        if (ballChoisie === null) {
            await triggerPokemonFlee();
            await showSplashText("Trop lent ! Le Pokémon s'enfuit !", 5000);
            stopMusic();
            return;
        }
        
        const puissance = await phaseAffaiblissement(POKEMON_FIGHTING);
        const hasFled = calculateFleeSiccess(puissance, config.resistence);
        if (hasFled) {
            await triggerPokemonFlee();
            await showSplashText("Le Pokémon n'était pas assez affaibli !", 5000);
            stopMusic();
            return;
        }
        const captureScore = await startCaptureMinigame(config);
        const resistence = config.resistence;
        await usePokeball(ballChoisie);
        
        const score = (puissance + captureScore) / 2;
        const ret = await capture(identifiant, score, ballChoisie.id);
        console.log("Résultat de la capture :", ret, identifiant, score, ballChoisie.id);
        if(!ret.success) {
            await showSplashText("Erreur de connection avec l'API !", 5000);
            stopMusic();
            return;
        }
        const {isCaught, chance, roll} = ret;
    
        await playCaptureSequence(isCaught, chance, ballChoisie, POKEMON_FIGHTING);
        if (isCaught) {
            if(roll < 1) await showSplashText("Capture critique !", 3000);
            break;
        }
        if(roll > 99) await showSplashText("Echec critique !", 3000);
        playCry(POKEMON_FIGHTING);
        if(await startDefenseMinigame(POKEMON_FIGHTING, baseDifficulty) === false) {
            await triggerPokemonFlee();
            await showSplashText("Le Pokémon s'enfuit !", 5000);
            stopMusic();
            break; 
        };
    }

    await closeTabAfter20s();
}

// recuperation du combat en cours depuis le serveur
const identifiant = await getIdentifiantParam();
const battleResult = await getBattle(identifiant);

if(battleResult.success) {
    const pokemon = await getPokemon(battleResult.battle.pokemon_id);
    pokemon.rarity = battleResult.battle.rarity;
    pokemon.isShiny = battleResult.battle.is_shiny;
    pokemon.domain_name = battleResult.battle.domain_name;
    
    // pokemon.rarity = "legendary"    // DEBUG
    // pokemon.isShiny = true       // DEBUG

    POKEMON_FIGHTING = pokemon;
    BATTLE_DATA = battleResult.battle;

    if (pokemon.rarity === "legendary" || pokemon.rarity === "epic") {
        startMusic("rare_capture", true, GLOBAL_MUSIC_VOLUME);
    } else {
        startMusic("capture", true, GLOBAL_MUSIC_VOLUME);
    }

    await startEncounter(pokemon);
    await lancerSequenceCapture();
}
