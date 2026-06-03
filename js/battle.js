import { startEncounter } from "./battle-annimation.js";
import { getPokeballs } from "./pokeballs.js";
import { startRummageSound, stopRummageSound } from "./sound.js";

const POKEBALL_CHOICE_DURATION = 3000; // Durée pour choisir une ball (en ms)

// --- LOGIQUE DU MINI-JEU 1 : CHOIX DE LA BALL ---
async function phaseChoixBall() {
    return new Promise(async (resolve) => {
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
                    resolve(ball.name); // Renvoie la ball choisie à la suite du code
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
                resolve("timeout"); 
                stopRummageSound();
            }
        }

        // Lance l'animation du timer
        timerFrame = requestAnimationFrame(updateTimer);
    });
}

async function lancerSequenceCapture() {
    console.log("Phase 1 : Choix de la Ball...");
    const ballChoisie = await phaseChoixBall();

    if (ballChoisie === "timeout") {
        console.log("Trop lent ! Le Pokémon s'enfuit !");
        // Gérer la fuite ou forcer une Pokéball
        return;
    }

    console.log(`Le joueur a choisi : ${ballChoisie}`);
    // Passer à la phase 2 : Affaiblissement (Osu circle)...
}

chrome.storage.local.get(["currentBattlePokemon"], async (result) => {
    const pokemon = result.currentBattlePokemon;
    if (!pokemon) return;

    await startEncounter(pokemon);
    await lancerSequenceCapture();
});