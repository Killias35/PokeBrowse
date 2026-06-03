import { playCry } from "./sound.js";

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

    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.classList.add('shiny-star');
        star.textContent = '✨';
        
        // Calcul d'une trajectoire circulaire avec une poussée vers le haut (asymétrique)
        const angle = Math.random() * Math.PI * 2;
        const distance = (Math.random() * 160) + 60;
        
        const tx = Math.cos(angle) * distance;
        // Le "- (Math.random() * 80)" force les étoiles à s'envoler vers le haut de l'écran
        const ty = Math.sin(angle) * distance - (Math.random() * 80); 

        container.appendChild(star);

        const duration = (Math.random() * 400) + 700; // Entre 700ms et 1100ms

        // Animation de pop, rotation, grandissement puis disparition en s'élevant
        star.animate([
            { transform: 'translate(0, 0) scale(0) rotate(0deg)', opacity: 0 },
            { transform: `translate(${tx * 0.4}px, ${ty * 0.4}px) scale(1.4) rotate(180deg)`, opacity: 1, offset: 0.3 },
            { transform: `translate(${tx}px, ${ty}px) scale(0) rotate(360deg)`, opacity: 0 }
        ], {
            duration: duration,
            easing: 'cubic-bezier(0.15, 0.85, 0.45, 1)',
            fill: 'forwards'
        });

        setTimeout(() => star.remove(), duration + i);
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

async function startEncounter(pokemon) {
    const container = document.getElementById("pokemon-zone");
    const shadow = document.getElementById("pokemon-shadow");
    const sprite = document.getElementById("pokemon-sprite");
    const flash = document.getElementById("encounter-effect");
    const burst = document.querySelector(".radial-burst");
    const dimBg = document.getElementById("dim-background");
    const lightRays = document.getElementById("light-rays");
    const name = document.getElementById("pokemon-name");
    const speedLines = document.getElementById("speed-lines");
    // Définir la rareté par défaut si elle n'existe pas
    const rarity = pokemon.rarity || 'commun'; 
    const isShiny = pokemon.shiny || true; // Détection du Shiny

    // Appliquer la couleur de rareté via la classe CSS
    container.className = `pokemon-zone rarity-${rarity}`;
    
    shadow.src = pokemon.sprites;
    sprite.src = pokemon.sprites;
    
    // --- PHASE 1 : ANTICIPATION ---
    await wait(500);

    // Assombrissement dramatique de l'écran pour les épiques/légendaires
    if (rarity === 'epic') dimBg.classList.add('active');
    if (rarity === 'legendary') dimBg.classList.add('intense');

    shadow.classList.add("shadow-enter");
    
    // Le suspense s'allonge en fonction de la rareté !
    let suspenseTime = 1000;
    if (rarity === 'rare') suspenseTime = 1300;
    if (rarity === 'epic') suspenseTime = 1800;
    if (rarity === 'legendary') suspenseTime = 2500; // Fait transpirer le joueur
    
    await wait(suspenseTime);

    // --- PHASE 2 : L'EXPLOSION (DOPAMINE) ---
    burst.classList.add("active");
    
    // Flash de couleur
    if(rarity === 'legendary' || rarity === 'epic') {
        flash.style.background = 'var(--glow-color)';
    } else {
        flash.style.background = 'white';
    }
    if (rarity === 'epic' || rarity === 'legendary') speedLines.classList.add("active");
    flash.classList.add("flash");

    // Impact frame
    document.body.classList.add("impact-flash");
    setTimeout(() => document.body.classList.remove("impact-flash"), 500);
    
    // Le tremblement et le cri
    let shakeLevel = 1;
    if (rarity === 'rare') shakeLevel = 2;
    if (rarity === 'epic' || rarity === 'legendary') shakeLevel = 3;
    cryEffect(pokemon, shakeLevel);

    // Les étincelles !
    spawnParticles(rarity);
    if (isShiny) {
        spawnShinyStars(35 * shakeLevel);
    }
    // Disparition de l'ombre
    shadow.classList.remove("shadow-enter");

    // Révélation
    sprite.classList.add("pokemon-reveal");
    sprite.classList.remove("pokemon-hide");

    // Activation des rayons de lumière permanents pour les top tiers
    if (rarity === 'epic' || rarity === 'legendary') {
        lightRays.classList.add('active');
    }

    name.textContent = pokemon.name;
    name.classList.add("slam");
    
    await wait(450);

    // --- PHASE 3 : RETOUR AU CALME ---
    sprite.classList.add("idle");
    dimBg.classList.remove('intense', 'active'); // La lumière du jour revient
    
    setTimeout(() => {
        flash.classList.remove("flash");
        flash.style.background = 'white'; // reset
    }, 500);
}

// Démarrage
chrome.storage.local.get(["currentBattlePokemon"], async (result) => {
    const pokemon = result.currentBattlePokemon;
    if (!pokemon) return;
    pokemon.rarity = 'legendary';
    
    // Assure-toi d'injecter une rareté dans ton objet pokemon au préalable !
    // ex: pokemon.rarity = 'legendary';
    await startEncounter(pokemon);
});