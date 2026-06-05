import { startEncounter, showSplashText, showScore, playCaptureSequence } from "./battle-annimation.js";
import { getPokeballs, usePokeball } from "./pokeballs.js";
import { startMusic, stopMusic, startRummageSound, stopRummageSound, playHitSound, startTargetingSound, stopTargetingSound, playCry } from "./sound.js";
import { capturePokemon } from "./utils.js";

const POKEBALL_CHOICE_DURATION = 3000; // Durée pour choisir une ball (en ms)
const COMBO_DURATION = 5000; // Durée de la phase de combo (en ms)
let POKEMON_FIGHTING = null; // Variable globale pour stocker le Pokémon en combat
const MAX_RETRY_TARGETING = 5;

const pokemon_sprite = document.getElementById("pokemon-sprite");
const combat_bg = document.getElementById("combat-bg");
const hpBar = document.getElementById("hp-bar-fill");
const hpBarBg = document.getElementById("hp-bar-bg");
const container = document.getElementById("combat-click-area");

let currentHpTier = null;    // evite les changements de classe inutiles et les animations à répétition quand on clique très vite sur le pokemon

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


function removeHpStatusBg() {
    combat_bg.classList.remove("bg-hp-50", "bg-hp-25", "bg-hp-0");
    hpBarBg.classList.remove("hp-shake", "global-shake", "hp-stress");
    hpBar.style.background = "";
}

function setHpStatusBg(percent) {
    let targetTier;
    if (percent > 70) targetTier = "90";
    else if (percent > 50) targetTier = "70";
    else if (percent > 25) targetTier = "50";
    else if (percent > 0) targetTier = "25";
    else targetTier = "0";

    if (currentHpTier === targetTier) return;
    removeHpStatusBg(); 

    if (targetTier === "70") {
        hpBarBg.classList.add("hp-shake");
    }
    else if (targetTier === "50") {
        combat_bg.classList.add("bg-hp-50");
        hpBar.style.background = "#f59e0b";
        hpBarBg.classList.add("hp-shake");
        hpBarBg.classList.add("global-shake");
    } else if (targetTier === "25") {
        combat_bg.classList.add("bg-hp-25");
        hpBar.style.background = "#ef4444";
        hpBarBg.classList.add("hp-shake");
        hpBarBg.classList.add("global-shake");
        hpBarBg.classList.add("hp-stress");
    } else if (targetTier === "0") {
        combat_bg.classList.add("bg-hp-0");
        hpBar.style.background = "#ef4444";
        hpBarBg.classList.add("hp-shake");
        hpBarBg.classList.add("global-shake");
        hpBarBg.classList.add("hp-stress");
    }

    currentHpTier = targetTier;
}

function removeHpStatus() {
    pokemon_sprite.classList.remove("hp-90", "hp-70", "hp-50", "hp-25", "hp-0");
}

function setHpStatus(percent) {
    setHpStatusBg(percent);
    removeHpStatus(); 

    if (percent > 70) {
        pokemon_sprite.classList.add("hp-90");
    } else if (percent > 50) {
        pokemon_sprite.classList.add("hp-70");
    } else if (percent > 25) {
        pokemon_sprite.classList.add("hp-50");
    } else if (percent > 0) {
        pokemon_sprite.classList.add("hp-25");
    } else {
        pokemon_sprite.classList.add("hp-0");
    }
}

// --- LOGIQUE DU MINI-JEU 1 : CHOIX DE LA BALL ---
async function phaseChoixBall() {
    return new Promise(async (resolve) => {
        setHpStatus(100);
        await showSplashText("CHOISIR UNE BALL !", 500);
        startRummageSound(); // Démarre le son de fouille

        const ui = document.getElementById("capture-ui");
        const container = document.getElementById("ball-container");
        const timerBar = document.getElementById("timer-bar");
        
        const balls = await getPokeballs();
        
        // 1. Générer l'interface des Balls
        container.innerHTML = "";
        balls.forEach(ball => {
            const btn = document.createElement("div");
            btn.className = `ball-btn ${ball.count <= 0 ? 'disabled' : ''}`;
            btn.innerHTML = `
                <img src="../assets/balls/${ball.name}.png" alt="${ball.name}" class="ball-img">
                <span class="ball-name">${ball.name}</span>
                <span class="ball-count">x${ball.count}</span>
            `;
            
            // Si on clique sur une ball valide
            if (ball.count > 0) {
                btn.addEventListener("click", () => {
                    cancelAnimationFrame(timerFrame); // Arrête le timer
                    ui.classList.add("hidden"); // Cache l'UI
                    stopRummageSound(); // Arrête le son de fouille
                    resolve(ball); // Renvoie la ball choisie à la suite du code
                });
            }
            container.appendChild(btn);
        });

        // Affiche l'UI
        ui.classList.remove("hidden");

        const startTime = performance.now();
        let timerFrame;

        function updateTimer(currentTime) {
            const elapsedTime = currentTime - startTime;
            const remainingTime = POKEBALL_CHOICE_DURATION - elapsedTime;
            const percentage = Math.max(0, (remainingTime / POKEBALL_CHOICE_DURATION) * 100);

            // Met à jour la largeur
            timerBar.style.width = `${percentage}%`;

            // Met à jour la couleur selon le temps restant
            if (percentage > 50) {
                timerBar.style.backgroundColor = "#10b981"; // Vert
            } else if (percentage > 20) {
                timerBar.style.backgroundColor = "#f59e0b"; // Orange
            } else {
                timerBar.style.backgroundColor = "#ef4444"; // Rouge
            }

            if (remainingTime > 0) {
                // Continue la boucle
                timerFrame = requestAnimationFrame(updateTimer);
            } else {
                // TEMPS ÉCOULÉ !
                ui.classList.add("hidden");
                // On peut décider de renvoyer 'null' ou forcer la ball de base
                resolve(null); 
                stopRummageSound();
            }
        }

        // Lance l'animation du timer
        timerFrame = requestAnimationFrame(updateTimer);
    });
}

async function phaseAffaiblissement() {
    await showSplashText("ATTAQUE LE !", 300);
    const rarity = POKEMON_FIGHTING.rarity;
    
    // Définir la vie totale basée sur la rareté
    let targetCPS = 6;
    if (rarity === "rare") targetCPS = 8;
    else if (rarity === "epic") targetCPS = 11;
    else if (rarity === "legendary") targetCPS = 13;
    let totalHp = targetCPS * (COMBO_DURATION / 1000);
    let currentHp = totalHp;

    container.classList.remove("hidden");
    
    return new Promise((resolve) => {
        const startTime = performance.now();
        let resolved = false;
        const onClick = async (e) => {
            if (e.button !== 0) return;
            currentHp--;
            
            // Mise à jour visuelle
            const percent = (currentHp / totalHp) * 100;
            hpBar.style.width = `${percent}%`;
            
            // effet sur pokemon
            removeHpStatus();
            let shakeX = (Math.random() - 0.5) * 30; // Décalage aléatoire entre -5px et 5px
            let shakeY = (Math.random() - 0.5) * 30;
            pokemon_sprite.classList.add("pokemon-hit");
            pokemon_sprite.style.setProperty('--shake-x', `${shakeX}px`);
            pokemon_sprite.style.setProperty('--shake-y', `${shakeY}px`);
 
            setTimeout(() => {
                pokemon_sprite.classList.remove("pokemon-hit");
                setHpStatus(percent);
            }, 50);

            // Changement de couleur
            
            if (percent == 0) playHitSound(percent / 100, true);
            else playHitSound(percent / 100);
            
            // Effet d'étincelle
            const spark = document.createElement("div");
            spark.className = "hit-spark";
            spark.style.left = (e.clientX - 40) + "px";
            spark.style.top = (e.clientY - 40) + "px";
            document.body.appendChild(spark);
            setTimeout(() => spark.remove(), 300);

            // Victoire si HP à 0
            if (currentHp <= 0) {
                resolved = true;
                cleanup();
                await showSplashText("!!!", 300);
                resolve(100);
            }
        };

        const cleanup = () => {
            container.removeEventListener("click", onClick);
        };

        container.addEventListener("click", onClick);

        // Timer de fin
        setTimeout(async () => {
            if (resolved) return;
            cleanup();
            let leftoverHpPercent = Math.min(100, Math.round((1 - (currentHp / totalHp)) * 100));
            await showSplashText("!", 300);
            resolve(leftoverHpPercent);
        }, COMBO_DURATION);
    });
}

async function startCaptureMinigame() {
    await showSplashText("VISE !", 600);

    return new Promise((resolve) => {
        const zone = document.getElementById("capture-zone");
        const pulseRing = document.getElementById("pulse-ring");
        const feedback = document.getElementById("capture-feedback");
        const targetRing = document.querySelector(".target-ring");
        const config = RARITY_SETTINGS[POKEMON_FIGHTING.rarity];
        let resolved = false;

        targetRing.style.setProperty('--target-size', `${config.targetSize}px`);
        pulseRing.style.setProperty('--target-size', `${config.targetSize}px`);
        pulseRing.style.setProperty('--shrink-duration', `${config.duration}s`);

        zone.classList.remove("hidden");
        feedback.className = ""; // Reset du texte
        startTargetingSound(config);

        const onCaptureClick = async (e) => {
            window.removeEventListener("click", onCaptureClick);
            stopTargetingSound();

            // GELER L'ANIMATION au moment exact du clic pour le feedback visuel
            const computedStyle = window.getComputedStyle(pulseRing);
            const currentTransform = computedStyle.transform;
            pulseRing.style.animation = "none";
            pulseRing.style.transform = currentTransform;

            // 3. CALCUL DU SCORE PAR LA TAILLE (getBoundingClientRect)
            const targetWidth = targetRing.offsetWidth; 
            const pulseWidth = pulseRing.getBoundingClientRect().width;

            const pixelDiff = Math.abs(targetWidth - pulseWidth);

            const severity = config.severity;
            let score = Math.round(100 - (pixelDiff * severity));
            if (score < 0) score = 0;
            await showScore(score);
                
            zone.classList.add("hidden");
            pulseRing.style.animation = "";
            pulseRing.style.transform = "";
            resolved = true;
            resolve(score);
        };

        setTimeout(async () => {
            if (resolved) return;
            window.removeEventListener("click", onCaptureClick);
            stopTargetingSound();
            await showScore(0);
            zone.classList.add("hidden");
            pulseRing.style.animation = "";
            pulseRing.style.transform = "";
            resolved = true;
            resolve(0);
        }, MAX_RETRY_TARGETING * config.duration * 1000);

        window.addEventListener("click", onCaptureClick);
    });
}

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
    while (true) {
        currentHpTier = null;
        hpBar.style.width = `100%`;

        setHpStatus(100);
        const ballChoisie = await phaseChoixBall();

        if (ballChoisie === null) {
            console.log("Trop lent ! Le Pokémon s'enfuit !");
            // Gérer la fuite ou forcer une Pokéball
            return;
        }
        
        // laisser un pourcentage de chance que le pokemon s'enfuit tout de suite si pas assez affaibli
        const puissance = await phaseAffaiblissement();
        const captureScore = await startCaptureMinigame();
        const resistence = RARITY_SETTINGS[POKEMON_FIGHTING.rarity].resistence;
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