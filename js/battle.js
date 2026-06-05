import { startEncounter, showSplashText, showScore, playCaptureSequence } from "./battle-annimation.js";
import { getPokeballs, usePokeball } from "./pokeballs.js";
import { capturePokemon } from "./utils.js";
import { startMusic, stopMusic, playCry } from "./sound.js";
import { setHpStatus, triggerPokemonFlee, phaseChoixBall, phaseAffaiblissement, startCaptureMinigame} from "./battle-minigame.js";

let POKEMON_FIGHTING = null; // Variable globale pour stocker le Pokémon en combat

// commun : 70% max de capture
// rare : 50% max de capture
// epic : 35% max de capture
// legendary : 20% max de capture
const RARITY_SETTINGS = {
    commun:     { resistence: 30, targetCPS: 8, duration: 1.6, targetSize: 80, pitchMax: 280, severity: 1 },
    rare:       { resistence: 50, targetCPS: 10, duration: 1.0, targetSize: 100,  pitchMax: 380, severity: 1.5 },
    epic:       { resistence: 65, targetCPS: 12, duration: 0.5, targetSize: 125,  pitchMax: 450, severity: 3.5 },
    legendary:  { resistence: 80, targetCPS: 15, duration: 0.4, targetSize: 150,  pitchMax: 550, severity: 5 },
};

function calculateCaptureSuccess(puissance, capture, ballPower, resistance) {
    let baseSkill = Math.min(100, Math.round((puissance + capture) /2 * ballPower));
    let finalChance = baseSkill - resistance;

    if (finalChance > 100) finalChance = 100;
    if (finalChance < 0) finalChance = 0;

    const roll = (Math.random() * 100).toFixed(2);
    let isCaught;
    let distance = Math.abs(finalChance - roll);
    console.log("baseSkill:", baseSkill, "finalChance:", finalChance, "roll:", roll, "distance:", distance);
    if (roll <= 1){         // Capture critique
        isCaught = true;
        console.log("Capture critique !");
    }
    else if (roll >= 99){   // Echec critique
        isCaught = false;
        console.log("Echec critique !");
    }
    else if (roll <= finalChance){  // Capture normale
        isCaught = true;
    }

    // On retourne le résultat et le pourcentage exact pour l'afficher ou débugger
    return {
        isCaught: isCaught,
        chance: distance,
        roll: roll
    };
}

async function lancerSequenceCapture() {
    const config = RARITY_SETTINGS[POKEMON_FIGHTING.rarity];
    while (true) {
        setHpStatus(100, true);
        const ballChoisie = await phaseChoixBall();

        if (ballChoisie === null) {
            console.log("Trop lent ! Le Pokémon s'enfuit !");
            await triggerPokemonFlee();
            stopMusic();
            return;
        }
        
        // laisser un pourcentage de chance que le pokemon s'enfuit tout de suite si pas assez affaibli
        const puissance = await phaseAffaiblissement(POKEMON_FIGHTING);
        const captureScore = await startCaptureMinigame(config);
        const resistence = config.resistence;
        await usePokeball(ballChoisie);

        const {isCaught, chance, roll} = calculateCaptureSuccess(puissance, captureScore, ballChoisie.power, resistence);
    
        await playCaptureSequence(isCaught, chance, ballChoisie, POKEMON_FIGHTING);
        if (isCaught) {
            await capturePokemon(POKEMON_FIGHTING);
            if(roll < 1) showSplashText("Capture critique !", 1000);
            else if(roll > 99) showSplashText("Echec critique !", 1000);
            break;
        }
        playCry(POKEMON_FIGHTING);
    }

}

chrome.storage.local.get(["currentBattlePokemon"], async (result) => {
    const pokemon = result.currentBattlePokemon;
    if (!pokemon) return;
    await chrome.storage.local.remove("currentBattlePokemon");
    // pokemon.rarity = "commun"    // DEBUG
    // pokemon.isShiny = true       // DEBUG

    POKEMON_FIGHTING = pokemon;
    if (pokemon.rarity === "legendary" || pokemon.rarity === "epic") {
        startMusic("rare_capture");
    } else {
        startMusic("capture");
    }

    await startEncounter(pokemon);
    await lancerSequenceCapture();
});