import { startEncounter, showSplashText } from "./battle-annimation.js";
import { getPokeballs } from "./pokeballs.js";
import { startMusic, stopMusic, startRummageSound, stopRummageSound, playHitSound } from "./sound.js";

const POKEBALL_CHOICE_DURATION = 3000; // Durée pour choisir une ball (en ms)
const COMBO_DURATION = 5000; // Durée de la phase de combo (en ms)
let POKEMON_FIGHTING = null; // Variable globale pour stocker le Pokémon en combat
const pokemon_sprite = document.getElementById("pokemon-sprite");

function removeHpStatus() {
    pokemon_sprite.classList.remove("hp-90", "hp-70", "hp-50", "hp-25", "hp-0");
}

function setHpStatus(percent) {
    removeHpStatus();
    if (percent > 70) pokemon_sprite.classList.add("hp-90");
    else if (percent > 50) pokemon_sprite.classList.add("hp-70");
    else if (percent > 25) pokemon_sprite.classList.add("hp-50");
    else if (percent > 0) pokemon_sprite.classList.add("hp-25");
    else pokemon_sprite.classList.add("hp-0");
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
    const hpBar = document.getElementById("hp-bar-fill");
    const container = document.getElementById("combat-click-area");
    
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
            if (percent < 30) hpBar.style.background = "#ef4444";
            else if (percent < 60) hpBar.style.background = "#f59e0b";
            
            playHitSound(percent / 100);

            if (percent < 75) {
                document.getElementById("hp-bar-bg").classList.add("hp-shake");
            }
            if (percent < 50) {
                document.getElementById("hp-bar-bg").classList.add("global-shake");
            }
            if (percent < 25) {
                document.getElementById("hp-bar-bg").classList.add("hp-stress");
            }
            
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
                await showSplashText("!!!", 100);
                resolve(100);
            }
        };

        const cleanup = () => {
            container.removeEventListener("mousedown", onClick);
        };

        container.addEventListener("mousedown", onClick);

        // Timer de fin
        setTimeout(async () => {
            if (resolved) return;
            cleanup();
            let leftoverHpPercent = Math.min(100, Math.round((1 - (currentHp / totalHp)) * 100));
            await showSplashText("!", 100);
            resolve(leftoverHpPercent);
        }, COMBO_DURATION);
    });
}

async function lancerSequenceCapture() {
    console.log("Phase 1 : Choix de la Ball...");
    const ballChoisie = await phaseChoixBall();

    if (ballChoisie === null) {
        console.log("Trop lent ! Le Pokémon s'enfuit !");
        // Gérer la fuite ou forcer une Pokéball
        return;
    }

    console.log(`Le joueur a choisi : ${ballChoisie.name} avec une puissance de capture de ${ballChoisie.power} !`);
    const puissance = await phaseAffaiblissement();
    console.log(`Phase de combo terminée avec ${puissance}% de puissance !`);

}

chrome.storage.local.get(["currentBattlePokemon"], async (result) => {
    const pokemon = result.currentBattlePokemon;
    if (!pokemon) return;

    POKEMON_FIGHTING = pokemon;
    if (pokemon.rarity === "legendary" || pokemon.rarity === "epic") {
        startMusic("rare_capture");
    } else {
        startMusic("capture");
    }

    await startEncounter(pokemon);
    await lancerSequenceCapture();
});