const DefenseConfig = {
    "fire": {
        name: "Feu",
        color: "#ef4444",
        baseSize: 20,       // Taille moyenne
        baseSpeed: 4,       // Vitesse moyenne
        spawnRate: 600,     // Un projectile toutes les 600ms
        effects: ["trail"], // Laisse une traînée mortelle au sol
        duration: 5000      // Dure 5 secondes
    },
    "rock": {
        name: "Roche",
        color: "#78716c",
        baseSize: 80,       // ÉNORME (Massive)
        baseSpeed: 2.5,     // Plus lent, mais prend de la place
        spawnRate: 700,
        effects: ["screen-shake"], // Fait trembler l'écran à chaque apparition
        duration: 5000
    },
    "flying": {
        name: "Vol",
        color: "#e0f2fe",
        baseSize: 15,
        baseSpeed: 5,
        spawnRate: 400,
        effects: ["wind"],  // Pousse l'avatar du joueur
        duration: 6000
    },
    "electric": {
        name: "Electrique",
        color: "#facc15",
        baseSize: 12,       // Petit
        baseSpeed: 5,      // ULTRA RAPIDE
        spawnRate: 200,     // Pluie de projectiles
        effects: ["zigzag"],// Trajectoire erratique (optionnel pour plus tard)
        duration: 4000
    }
};

// Les variables globales du jeu d'esquive
let defenseAnimationFrame;
let defenseIntervals = [];

export async function startDodgeMinigame(pokemonType, difficultyMultiplier) {
    // 🛡️ MAGIE ICI : On retourne une Promesse qui met le reste du code en pause !
    return new Promise((resolve) => {
        const arena = document.getElementById("defense-arena");
        const avatar = document.getElementById("player-avatar");
        const timerDisplay = document.getElementById("defense-timer");
        const headerWarning = document.getElementById("defense-warning"); // Le sous-titre
        
        // Nettoyage visuel au cas où l'arène resservirait
        arena.style.boxShadow = "inset 0 0 50px rgba(0,0,0,0.8)";
        avatar.style.background = "#3b82f6";

        // 🎨 1. APPLICATION DU THÈME
        // On nettoie les anciennes classes et on ajoute la nouvelle
        arena.className = ""; 
        const themeClass = `theme-${pokemonType.toLowerCase()}`;
        arena.classList.add(themeClass);

        // 🚨 2. LE TEXTE D'ALERTE DOPAMINERGIQUE
        const config = DefenseConfig[pokemonType] || DefenseConfig["fire"];
        headerWarning.innerText = `⚠️ ATTAQUE ${config.name.toUpperCase()} ⚠️`;
        headerWarning.style.color = config.color;
        
        // Effet visuel sur le timer pour marquer le début
        timerDisplay.classList.add("type-warning-text");
        timerDisplay.style.color = config.color;
        timerDisplay.innerText = "PRÊT ?";
        
        // 1. Récupération de la configuration
        
        const speed = config.baseSpeed * (1 + (difficultyMultiplier * 0.2));
        const spawnRate = config.spawnRate / (1 + (difficultyMultiplier * 0.3));
        let timeLeft = config.duration * (1 + (difficultyMultiplier * 0.2));

        // 2. Gestion de la position
        let mouseX = 300, mouseY = 200;
        let avatarX = 300, avatarY = 200;
        
        // On crée une fonction nommée pour pouvoir retirer l'Event Listener proprement à la fin
        const trackMouse = (e) => {
            const rect = arena.getBoundingClientRect();
            mouseX = e.clientX - rect.left;
            mouseY = e.clientY - rect.top;
        };
        arena.addEventListener("mousemove", trackMouse);

        let isGameOver = false;
        let projectiles = [];
        let trails = [];

        const isWindy = config.effects.includes("wind");
        // Si c'est le vent, l'élastique est très détendu (0.05), le contrôle est lourd et glissant.
        // Sinon, contrôle ultra réactif (0.3).
        const friction = isWindy ? 0.05 : 0.3; 
        const windForce = isWindy ? 15 * difficultyMultiplier * 0.1 : 0;

        // 3. Boucle principale
        function gameLoop() {
            if (isGameOver) return;

            // Mouvement de l'avatar
            avatarX += (mouseX - avatarX) * friction;
            avatarY += (mouseY - avatarY) * friction;

            // 2. La force pure de la tornade (Pousse vers la droite)
            avatarX += windForce;

            // Clamp (On garde l'avatar strictement dans l'arène)
            avatarX = Math.max(12, Math.min(588, avatarX));
            avatarY = Math.max(12, Math.min(388, avatarY));

            avatar.style.left = `${avatarX}px`;
            avatar.style.top = `${avatarY}px`;

            // Gestion des projectiles
            for (let i = projectiles.length - 1; i >= 0; i--) {
                let p = projectiles[i];
                p.y += p.vy; 

                if (config.effects.includes("trail") && Math.random() < 0.2) {
                    createTrail(p.x, p.y, arena, trails);
                }

                p.element.style.top = `${p.y}px`;

                const dist = Math.hypot(avatarX - p.x, avatarY - p.y);
                const collisionDistance = 12 + (p.size / 2); 

                if (dist < collisionDistance) {
                    triggerDefeat();
                    return; 
                }

                for (let trail of trails) {
                    if (Math.hypot(avatarX - trail.x, avatarY - trail.y) < 22) {
                        triggerDefeat();
                        return;
                    }
                }

                if (p.y > 450) {
                    p.element.remove();
                    projectiles.splice(i, 1);
                }
            }

            defenseAnimationFrame = requestAnimationFrame(gameLoop);
        }

        // 4. Générateur de Projectiles
        function spawnProjectile() {
            if (isGameOver) return;

            const size = config.baseSize;
            const x = Math.random() * (600 - size) + (size / 2);
            const y = -size;

            const el = document.createElement("div");
            el.className = "defense-projectile";
            el.style.width = `${size}px`;
            el.style.height = `${size}px`;
            el.style.background = config.color;
            el.style.color = config.color;
            el.style.left = `${x}px`;
            el.style.top = `${y}px`;

            if (config.effects.includes("screen-shake")) {
                arena.style.transform = `translate(${(Math.random()-0.5)*10}px, ${(Math.random()-0.5)*10}px)`;
                setTimeout(() => arena.style.transform = "translate(0,0)", 50);
            }

            arena.appendChild(el);
            projectiles.push({ x, y, vy: speed, size, element: el });
        }

        
        setTimeout(() => {
            if(isGameOver) return;
            
            // On enlève le texte "PRÊT ?" et on remet le timer normal
            timerDisplay.classList.remove("type-warning-text");
            timerDisplay.style.color = "white";

            // Démarrage des spawns et du timer de jeu
            const timerInterval = setInterval(() => {
                timeLeft -= 100;
                timerDisplay.innerText = (Math.max(0, timeLeft) / 1000).toFixed(1);

                if (timeLeft <= 0 && !isGameOver) {
                    triggerVictory();
                }
            }, 100);

            const spawnInterval = setInterval(spawnProjectile, spawnRate);
            defenseIntervals.push(timerInterval, spawnInterval);

            // Démarre la boucle physique !
            gameLoop();
            
        }, 1200);

        // --- FONCTIONS DE FIN (C'est ici qu'on débloque ton script principal !) ---

        function triggerDefeat() {
            isGameOver = true;
            cleanUpGame();
            arena.style.boxShadow = "inset 0 0 100px #ef4444";
            avatar.style.background = "#ef4444";
            
            // On attend 1 seconde pour le feedback visuel, puis on libère la promesse avec FALSE
            setTimeout(() => {
                resolve(false); 
            }, 1000);
        }

        function triggerVictory() {
            isGameOver = true;
            cleanUpGame();
            arena.style.boxShadow = "inset 0 0 100px #22c55e"; 
            
            // On attend 1 seconde pour savourer, puis on libère la promesse avec TRUE
            setTimeout(() => {
                resolve(true); 
            }, 1000);
        }

        function cleanUpGame() {
            cancelAnimationFrame(defenseAnimationFrame);
            defenseIntervals.forEach(clearInterval);
            defenseIntervals = [];
            arena.removeEventListener("mousemove", trackMouse); // On nettoie les écouteurs !
            arena.className = "";

            // Suppression de tous les projectiles restants sur le terrain
            projectiles.forEach(p => p.element.remove());
            projectiles = [];
            
            // Retrait des traînées de feu
            const activeTrails = document.querySelectorAll('.fire-trail');
            activeTrails.forEach(t => t.remove());
            trails = [];
        }
    });
}

// Fonction utilitaire pour le type Feu
function createTrail(x, y, arena, trailsArray) {
    const el = document.createElement("div");
    el.className = "fire-trail";
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    arena.appendChild(el);
    
    // Enregistre pour la collision
    const trailData = { x, y };
    trailsArray.push(trailData);

    // Fait disparaître la traînée après 1 seconde
    setTimeout(() => {
        el.style.opacity = "0";
        // Retire de la liste des collisions
        const index = trailsArray.indexOf(trailData);
        if (index > -1) trailsArray.splice(index, 1);
        setTimeout(() => el.remove(), 1000);
    }, 1000);
}