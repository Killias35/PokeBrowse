import { playCry, playShiny, playSuspenseSound, playImpactBoom, playWhooshSound, playHitSound } from "./sound.js";

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Nouvelle fonction pour générer une explosion de particules
function spawnParticles(rarity, containerId = "particles-container") {
    const container = document.getElementById(containerId);
    let particleCount = 0;

    if (rarity === 'commun') particleCount = 10;
    if (rarity === 'rare') particleCount = 25;
    if (rarity === 'epic') particleCount = 50;
    if (rarity === 'legendary') particleCount = 100;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        // Direction et distance aléatoires
        const angle = Math.random() * Math.PI * 2;
        const distance = (Math.random() * 200) + 50; 
        
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;

        container.appendChild(particle);

        // Animation Web API dynamique
        particle.animate([
            { transform: 'translate(0, 0) scale(1)', opacity: 1 },
            { transform: `translate(${tx}px, ${ty}px) scale(0)`, opacity: 0 }
        ], {
            duration: (Math.random() * 500) + 500, // 500ms à 1s
            easing: 'cubic-bezier(0,.9,.5,1)',
            fill: 'forwards'
        });

        // Nettoyage
        setTimeout(() => particle.remove(), 1000);
    }
}

function spawnShinyStars(starCount = 35) {
    const container = document.getElementById("particles-container");
    if (!container) return;
    playShiny(); // Joue le son de capture Shiny

    // S'assurer que le conteneur lui-même n'est pas bloqué derrière
    container.style.zIndex = "999"; 
    container.style.position = "absolute";

    for (let i = 0; i < starCount; i++) {
        // L'effet "Rafale" (Stagger) : on décale la création de chaque étoile de 12ms
        setTimeout(() => {
            const star = document.createElement('div');
            star.classList.add('shiny-star');
            star.textContent = '✨';
            
            // Étoiles de tailles variées (entre 24px et 50px) pour plus de profondeur
            const randomSize = Math.floor(Math.random() * 26) + 24;
            star.style.fontSize = `${randomSize}px`;
            
            // Calcul de la trajectoire
            const angle = Math.random() * Math.PI * 2;
            const distance = (Math.random() * 180) + 70; // Légèrement plus loin
            
            const tx = Math.cos(angle) * distance;
            // Poussée verticale accentuée vers le haut
            const ty = Math.sin(angle) * distance - (Math.random() * 120 + 40); 

            container.appendChild(star);

            const duration = (Math.random() * 300) + 800; // Entre 800ms et 1100ms

            // Nouvelle courbe d'animation : l'étoile reste visible plus longtemps à son apogée
            star.animate([
                { transform: 'translate(0, 0) scale(0) rotate(0deg)', opacity: 0 },
                { transform: `translate(${tx * 0.4}px, ${ty * 0.4}px) scale(1.5) rotate(180deg)`, opacity: 1, offset: 0.2 },
                { transform: `translate(${tx * 0.8}px, ${ty * 0.8}px) scale(1.2) rotate(270deg)`, opacity: 1, offset: 0.75 },
                { transform: `translate(${tx}px, ${ty}px) scale(0) rotate(360deg)`, opacity: 0 }
            ], {
                duration: duration,
                easing: 'cubic-bezier(0.1, 0.8, 0.3, 1)',
                fill: 'forwards'
            });

            // Nettoyage après l'animation
            setTimeout(() => star.remove(), duration);
            
        }, i * 12); // Délai cumulé pour l'effet cascade
    }
}

async function cryEffect(pokemon, level = 1) {
    let shakeClass = "screen-shake-little";
    let duration = 500;

    if (level === 1) shakeClass = "screen-shake-little";
    else if (level === 2) shakeClass = "screen-shake-medium";
    else {
        shakeClass = "screen-shake-big";
        duration = 800; // Tremblement plus long pour les légendaires
    }
    
    playCry(pokemon);
    document.body.classList.add(shakeClass);
    setTimeout(() => {
        document.body.classList.remove(shakeClass);
    }, duration);
}

export async function startEncounter(pokemon) {
    const container = document.getElementById("pokemon-zone");
    const shadow = document.getElementById("pokemon-shadow");
    const sprite = document.getElementById("pokemon-sprite");
    const flash = document.getElementById("encounter-effect");
    const burst = document.querySelector(".radial-burst");
    const dimBg = document.getElementById("dim-background");
    const lightRays = document.getElementById("light-rays");
    const name = document.getElementById("pokemon-name");
    const rarityDisplay = document.getElementById("pokemon-rarity");
    const speedLines = document.getElementById("speed-lines");

    // Définir la rareté par défaut si elle n'existe pas
    const rarity = pokemon.rarity;
    const isShiny = pokemon.isShiny; // Détection du Shiny

    // Appliquer la couleur de rareté via la classe CSS
    container.className = `pokemon-zone rarity-${rarity}`;
    
    shadow.src = pokemon.sprites;
    sprite.src = pokemon.isShiny ? pokemon.shiny : pokemon.sprites;
    
    // --- PHASE 1 : ANTICIPATION ---
    await wait(500);

    if (rarity === 'epic') dimBg?.classList.add('active');
    if (rarity === 'legendary') dimBg?.classList.add('intense');
    if (speedLines && (rarity === 'epic' || rarity === 'legendary' || isShiny)) {
        speedLines.classList.add("active");
    }

    // Calcul du temps d'attente
    let suspenseTime = 1000;
    if (rarity === 'rare') suspenseTime = 1300;
    if (rarity === 'epic') suspenseTime = 1800;
    if (rarity === 'legendary') suspenseTime = 2500; 

    playSuspenseSound(rarity, suspenseTime); 

    shadow.classList.add("shadow-enter");
    
    await wait(suspenseTime);

    // --- PHASE 2 : L'EXPLOSION ---
    burst.classList.add("active");
    
    // Flash de couleur
    if(rarity === 'legendary' || rarity === 'epic') {
        flash.style.background = 'var(--glow-color)';
    } else {
        flash.style.background = 'white';
    }
    flash.classList.add("flash");
    playImpactBoom();

    // Impact frame
    document.body.classList.add("impact-flash");
    setTimeout(() => document.body.classList.remove("impact-flash"), 500);
    
    // Le tremblement et le cri
    let shakeLevel = 1;
    if (rarity === 'rare') shakeLevel = 2;
    if (rarity === 'epic' || rarity === 'legendary') shakeLevel = 3;
    cryEffect(pokemon, shakeLevel);

    // Les étincelles
    spawnParticles(rarity);
    if (isShiny) {
        spawnShinyStars(35 * shakeLevel);
    }
    // Disparition de l'ombre
    shadow.classList.remove("shadow-enter");

    // Révélation
    sprite.classList.remove("pokemon-hide");
    sprite.classList.add("pokemon-reveal");

    // Activation des rayons de lumière permanents pour les top tiers
    if (rarity === 'epic' || rarity === 'legendary') {
        lightRays.classList.add('active');
    }

    await wait(900);

    name.textContent = pokemon.name;
    name.classList.add("slam");
    playWhooshSound();

    await wait(500);

    rarityDisplay.textContent = rarity; 
    rarityDisplay.classList.add("rarity-slam");
    playWhooshSound();

    setTimeout(() => {
        flash.classList.remove("flash");
        flash.style.background = 'white';
    }, 500);

    // --- PHASE 3 : RETOUR AU CALME ---
    dimBg.classList.remove('intense', 'active'); // La lumière du jour revient
    
    setTimeout(() => {
        flash.classList.remove("flash");
        flash.style.background = 'white'; // reset
    }, 500);

    await wait(500);
    sprite.classList.remove("pokemon-reveal");
}

export function showSplashText(text, duration = 1000) {
    return new Promise((resolve) => {
        const splashScreen = document.getElementById("splash-screen");
        const splashText = document.getElementById("splash-text");
        
        splashText.textContent = text;
        splashScreen.classList.remove("hidden");
        
        // On réinitialise l'animation pour qu'elle rejoue à chaque fois
        splashText.style.animation = 'none';
        splashText.offsetHeight; /* Trigger reflow */
        splashText.style.animation = null;

        setTimeout(() => {
            splashScreen.classList.add("hidden");
            setTimeout(resolve, 200); // Petit délai pour le fade out
        }, duration);
    });
}

export async function showScore(score){
    const feedback = document.getElementById("capture-feedback");

    let text = "MISS...";
    let color = "#ef4444"; // Rouge
    let isCritical = false;

    if (score >= 95) {
        text = "CRITICAL PERFECT !!!";
        color = "#f59e0b"; // Or ardent
        isCritical = true;

        document.body.style.animation = "none";
        setTimeout(() => document.body.style.animation = "violence 0.3s ease-in-out", 10);
        playHitSound(1.5, true);
    } else if (score >= 80) {
        text = "PERFECT !";
        color = "#10b981"; // Vert émeraude
        document.body.style.animation = "none";
        setTimeout(() => document.body.style.animation = "violence 0.2s ease-in-out", 10);
        playHitSound(1, true);
    } else if (score >= 50) {
        text = "GREAT";
        color = "#06b6d4"; // Cyan
        playHitSound(1, false);
    } else if (score >= 20) {
        text = "NICE";
        color = "#3b82f6"; // Bleu
        playHitSound(1, false);
    }

    feedback.style.setProperty('--glow-color', color);
    feedback.innerText = text;
    feedback.style.color = "#fff";

    if (isCritical) {
        feedback.className = "critical-panic";
    } else {
        feedback.className = "pop-feedback";
    }
    return new Promise((resolve) => setTimeout(resolve, 300));
}