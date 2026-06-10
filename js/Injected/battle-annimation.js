import { playCry, playShiny, playSuspenseSound, playImpactBoom, playWhooshSound, playHitSound, playSfx } from "./sound.js";
import { startMusic, stopMusic } from '../musique.js';
import { getVolumesParam } from "../settingsUtils.js";

const Volumes = await getVolumesParam();
const GLOBAL_MUSIC_VOLUME = Volumes.musicVolume;

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


function waitForAnim(el, fallbackMs = 1000) {
    return new Promise((resolve) => {
        const handler = () => { el.removeEventListener("animationend", handler); resolve(); };
        el.addEventListener("animationend", handler);
        setTimeout(resolve, fallbackMs + 50); // sécurité
    });
}

/**
 * Change l'état (classe) d'un élément proprement :
 * retire toutes les classes state-* existantes, puis ajoute la nouvelle.
 */
function setState(el, newState) {
    const toRemove = [...el.classList].filter(c => c.startsWith("state-"));
    el.classList.remove(...toRemove);
    if (newState) el.classList.add("state-" + newState);
}

/**
 * Déclenche un flash sur #cap-flash.
 * type : "white" | "orange" | "red" | "gold"
 */
function triggerFlash(type) {
    const flash = document.getElementById("cap-flash");
    flash.className = "";            // retire les classes précédentes
    void flash.offsetWidth;          // force reflow pour relancer l'animation
    flash.classList.add(`flash-${type}`);
    flash.addEventListener("animationend", () => flash.className = "", { once: true });
}

/**
 * Crée un ripple (ondulation) centré en (x, y) viewport.
 * color : ex. "rgba(255,215,0,0.8)"
 */
function spawnRipple(x, y, color = "rgba(255,255,255,0.6)") {
    const r = document.createElement("div");
    r.className = "cap-ripple";
    r.style.left  = x + "px";
    r.style.top   = y + "px";
    r.style.borderColor = color;
    document.getElementById("cap-stage").appendChild(r);
    r.addEventListener("animationend", () => r.remove(), { once: true });
}

/**
 * Crée une lueur de tremblement centrée en (x, y).
 */
function spawnShakeGlow(x, y) {
    const g = document.createElement("div");
    g.className = "cap-shake-glow";
    g.style.left = x + "px";
    g.style.top  = y + "px";
    document.getElementById("cap-stage").appendChild(g);
    g.addEventListener("animationend", () => g.remove(), { once: true });
}

/**
 * Explose des particules depuis (cx, cy).
 * colors : tableau de couleurs CSS.
 */
function spawnBurst(cx, cy, count = 18, colors = ["#fff", "#ffd700", "#ff6464"]) {
    const stage = document.getElementById("cap-stage");
    for (let i = 0; i < count; i++) {
        const p = document.createElement("div");
        p.className = "cap-particle";
        const angle = (i / count) * 360 + Math.random() * (360 / count);
        const dist  = 45 + Math.random() * 80;
        const size  = 4 + Math.random() * 6;
        p.style.cssText = `
            left: ${cx}px; top: ${cy}px;
            width: ${size}px; height: ${size}px;
            background: ${colors[i % colors.length]};
            --px: ${Math.cos(angle * Math.PI / 180) * dist}px;
            --py: ${Math.sin(angle * Math.PI / 180) * dist}px;
        `;
        stage.appendChild(p);
        p.addEventListener("animationend", () => p.remove(), { once: true });
    }
}

/**
 * Anneau d'absorption multi-couches sur le Pokémon.
 */
function spawnAbsorbRings(cx, cy) {
    const stage = document.getElementById("cap-stage");
    const classes = ["", "ring-2", "ring-3"];
    classes.forEach((cls) => {
        const r = document.createElement("div");
        r.className = "cap-absorb-ring" + (cls ? ` ${cls}` : "");
        r.style.left = cx + "px";
        r.style.top  = cy + "px";
        stage.appendChild(r);
        r.addEventListener("animationend", () => r.remove(), { once: true });
    });
}

/**
 * Vortex de particules colorées qui convergent vers la ball.
 * Elles partent en orbite autour du Pokémon et spiralent vers le centre.
 */
function spawnVortex(pokeCx, pokeCy, ballCx, ballCy, count = 24) {
    const stage = document.getElementById("cap-stage");
    const COLORS = ["#ff4d4d", "#ff9f00", "#ffde00", "#4fc3f7", "#e040fb", "#69ff47", "#fff"];

    for (let i = 0; i < count; i++) {
        const p = document.createElement("div");
        p.className = "cap-vortex-particle";

        const angle  = (i / count) * 360;
        const radius = 30 + Math.random() * 65;
        const startX = pokeCx + Math.cos(angle * Math.PI / 180) * radius;
        const startY = pokeCy + Math.sin(angle * Math.PI / 180) * radius;

        // Destination = ball (on calcule le delta depuis la position de départ)
        const toX = ballCx - startX;
        const toY = ballCy - startY;

        const delay    = (i / count) * 0.35;
        const duration = 0.45 + Math.random() * 0.2;
        const size     = 5 + Math.random() * 5;

        p.style.cssText = `
            left: ${startX}px; top: ${startY}px;
            width: ${size}px; height: ${size}px;
            background: ${COLORS[i % COLORS.length]};
            --vtx: ${toX}px; --vty: ${toY}px;
            --vd: ${duration}s; --vdel: ${delay}s;
            --vrot: ${90 + Math.random() * 360}deg;
        `;
        stage.appendChild(p);
        p.addEventListener("animationend", () => p.remove(), { once: true });
    }
}

/**
 * Trainées de lumière aspirées (lignes de couleur qui filent vers la ball).
 */
function spawnAbsorbStreaks(pokeCx, pokeCy, ballCx, ballCy, count = 12) {
    const stage = document.getElementById("cap-stage");
    const COLORS = ["rgba(100,200,255,0.8)", "rgba(220,100,255,0.7)", "rgba(255,200,50,0.7)", "rgba(255,255,255,0.6)"];

    for (let i = 0; i < count; i++) {
        const s = document.createElement("div");
        s.className = "cap-absorb-streak";

        const angle  = (i / count) * 360;
        const radius = 50 + Math.random() * 60;
        const startX = pokeCx + Math.cos(angle * Math.PI / 180) * radius;
        const startY = pokeCy + Math.sin(angle * Math.PI / 180) * radius;

        const toX = ballCx - startX;
        const toY = ballCy - startY;

        const delay    = (i / count) * 0.25;
        const duration = 0.5 + Math.random() * 0.2;

        s.style.cssText = `
            left: ${startX}px; top: ${startY}px;
            background: ${COLORS[i % COLORS.length]};
            --stx: ${toX}px; --sty: ${toY}px;
            --srot: ${angle + 90}deg;
            --sd: ${duration}s; --sdel: ${delay}s;
        `;
        stage.appendChild(s);
        s.addEventListener("animationend", () => s.remove(), { once: true });
    }
}

/**
 * Étoiles orbitales (burst succès).
 */
function spawnStarBurst(cx, cy, count = 7) {
    const stage = document.getElementById("cap-stage");
    for (let i = 0; i < count; i++) {
        const s = document.createElement("div");
        s.className = "cap-star";
        const angle = (i / count) * 360;
        const r     = 65 + Math.random() * 40;
        s.innerHTML = ["★", "✦", "✧", "✱"][i % 4];
        s.style.left = (cx + Math.cos(angle * Math.PI / 180) * r) + "px";
        s.style.top  = (cy + Math.sin(angle * Math.PI / 180) * r - 12) + "px";
        setTimeout(() => stage.appendChild(s), i * 70);
        s.addEventListener("animationend", () => s.remove(), { once: true });
    }
}

/**
 * Étoiles tombantes (victoire).
 */
function spawnFallingStars(count = 12) {
    const stage = document.getElementById("cap-stage");
    for (let i = 0; i < count; i++) {
        const s = document.createElement("div");
        s.className = "cap-falling-star";
        s.innerHTML = ["★", "✦", "✧", "✱"][i % 4];
        s.style.cssText = `
            left: ${10 + Math.random() * 80}%;
            font-size: ${12 + Math.random() * 18}px;
            color: ${["#ffd700", "#fff", "#ffe066", "#ffb347"][i % 4]};
            --fs-dur: ${0.9 + Math.random() * 1.2}s;
            --fs-del: ${i * 0.09}s;
        `;
        stage.appendChild(s);
        s.addEventListener("animationend", () => s.remove(), { once: true });
    }
}

// ─── Calcul des positions stables ───────────────────────────────────────────

/**
 * Renvoie le centre du sprite Pokémon en coordonnées viewport (px).
 * Appelé UNE SEULE FOIS avant de lancer les animations.
 */
function getPokemonCenter() {
    const sprite = document.getElementById("pokemon-sprite");
    if (!sprite) return { x: window.innerWidth / 2, y: window.innerHeight * 0.35 };
    const r = sprite.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, rect: r };
}

/**
 * Position fixe de la ball "en l'air" (après le lancer, avant la chute).
 * Correspond au `bottom: 55%; left: 50%` du CSS.
 */
function getBallAirCenter() {
    return {
        x: window.innerWidth  * 0.5,
        y: window.innerHeight * (1 - 0.55) - 32, // 32 = moitié de la ball
    };
}

/**
 * Position fixe de la ball "au sol" — bottom: 28%, left: 50%.
 */
function getBallGroundCenter() {
    return {
        x: window.innerWidth  * 0.5,
        y: window.innerHeight * (1 - 0.28) - 32,
    };
}

// ─── Phases ─────────────────────────────────────────────────────────────────

async function phaseThrow(ballName) {
    const ballWrap = document.getElementById("cap-ball-wrap");
    const ball     = document.getElementById("cap-ball");

    ball.src = `../assets/balls/${ballName}.png`;

    setState(ballWrap, "throw");
    await waitForAnim(ballWrap, 700);
}

async function phaseAbsorb(pokeCenter) {
    const sprite   = document.getElementById("pokemon-sprite");
    const ghost    = document.getElementById("cap-poke-ghost");
    const ballWrap = document.getElementById("cap-ball-wrap");
    playSfx("pokeball capture");

    const { x: pokeCx, y: pokeCy, rect } = pokeCenter;
    const ballAir = getBallAirCenter();

    // ① Fixer les CSS vars du ghost UNE SEULE FOIS (viewport px → valeur directe)
    ghost.src = sprite ? sprite.src : "";
    ghost.style.setProperty("--poke-l", (rect ? rect.left : pokeCx - 60) + "px");
    ghost.style.setProperty("--poke-t", (rect ? rect.top  : pokeCy - 60) + "px");
    ghost.style.setProperty("--poke-w", (rect ? rect.width  : 120) + "px");
    ghost.style.setProperty("--poke-h", (rect ? rect.height : 120) + "px");

    // ② Flash d'impact
    triggerFlash("white");
    await wait(80);

    // ③ Cacher le vrai sprite
    if (sprite) sprite.style.visibility = "hidden";

    // ④ Anneaux d'absorption
    spawnAbsorbRings(pokeCx, pokeCy);

    // ⑤ Vortex de particules & trainées
    spawnVortex(pokeCx, pokeCy, ballAir.x, ballAir.y, 28);
    spawnAbsorbStreaks(pokeCx, pokeCy, ballAir.x, ballAir.y, 14);

    // ⑥ Ghost Pokémon → aspiré
    ghost.classList.remove("hidden");
    setState(ghost, "sucked");
    await waitForAnim(ghost, 800);

    ghost.classList.add("hidden");
    setState(ghost, null);

    // ⑦ Ball "clac" → absorbée
    setState(ballWrap, "absorbed");
    triggerFlash("orange");
    spawnBurst(ballAir.x, ballAir.y, 16, ["#ff4d4d", "#ffde00", "#fff", "#ff9f00"]);
    await waitForAnim(ballWrap, 400);
}

async function phaseFall() {
    const ballWrap = document.getElementById("cap-ball-wrap");
    const shadow   = document.getElementById("cap-shadow");

    setState(ballWrap, "fall");
    shadow.className = "";
    void shadow.offsetWidth;
    shadow.classList.add("shadow-appear");

    playSfx("pokeball fall");
    await waitForAnim(ballWrap, 750);

    // Retirer la classe d'animation du shadow et le laisser visible
    shadow.className = "shadow-visible";
}

async function phaseShake(isCaught, chanceDistence) {
    const ballWrap  = document.getElementById("cap-ball-wrap");
    const shadow    = document.getElementById("cap-shadow");

    // Fixer la position "sol" sans animation
    setState(ballWrap, "ground");

    const shakeCount = isCaught ? 3
        : chanceDistence <= 20 ? 2
        : chanceDistence <= 50 ? 1
        : 0;

    const groundCenter = getBallGroundCenter();

    for (let i = 1; i <= shakeCount; i++) {
        await wait(380);
        playSfx("shaking"+i);

        // Zoom cumulatif via CSS var
        ballWrap.style.setProperty("--cap-zoom", 1 + (i - 1) * 0.22);

        setState(ballWrap, `shake-${i}`);

        spawnShakeGlow(groundCenter.x, groundCenter.y);
        spawnRipple(groundCenter.x, groundCenter.y, "rgba(255,200,50,0.75)");

        await waitForAnim(ballWrap, 560);

        // Revenir au sol entre deux tremblements
        setState(ballWrap, "ground");
        await wait(260);
    }

    // Retourner le nombre de tremblements pour usage externe
    return shakeCount;
}

async function phaseSuccess(shakeCount) {
    const ballWrap    = document.getElementById("cap-ball-wrap");
    const shadow      = document.getElementById("cap-shadow");
    const groundCenter = getBallGroundCenter();
    stopMusic();
    // Zoom final conservé depuis le dernier tremblement
    setState(ballWrap, "caught");

    triggerFlash("gold");
    spawnBurst(groundCenter.x, groundCenter.y, 40, ["#ffd700", "#fff", "#ff9f00", "#ffe066", "#ffb347"]);
    spawnStarBurst(groundCenter.x, groundCenter.y, 8);
    spawnRipple(groundCenter.x, groundCenter.y, "rgba(255,215,0,0.9)");
    setTimeout(() => spawnRipple(groundCenter.x, groundCenter.y, "rgba(255,180,0,0.55)"), 220);
    setTimeout(() => spawnRipple(groundCenter.x, groundCenter.y, "rgba(255,140,0,0.4)"),  450);
    spawnFallingStars(14);
    playSfx("pokeball captured");

    await wait(900);
    startMusic("captured", false, GLOBAL_MUSIC_VOLUME);
    // Message
    const msg = document.getElementById("cap-message");
    msg.textContent = "✦ Pokémon capturé ! ✦";
    msg.className = "msg-success";
    void msg.offsetWidth;
    msg.classList.add("msg-show");
    
    await wait(2000);

    // Fade out shadow
    shadow.classList.remove("shadow-visible");
    shadow.classList.add("shadow-gone");
}

async function phaseEscape(shakeCount) {
    const ballWrap    = document.getElementById("cap-ball-wrap");
    const ghost       = document.getElementById("cap-poke-ghost");
    const sprite      = document.getElementById("pokemon-sprite");
    const shadow      = document.getElementById("cap-shadow");
    playSfx("pokeball escape");

    // Conserver le zoom du dernier tremblement
    setState(ballWrap, "open");
    triggerFlash("red");

    const groundCenter = getBallGroundCenter();
    spawnBurst(groundCenter.x, groundCenter.y, 22, ["#ff4d4d", "#ff9f00", "#fff"]);
    spawnRipple(groundCenter.x, groundCenter.y, "rgba(255,80,80,0.85)");

    await waitForAnim(ballWrap, 350);
    await wait(200);

    // Pokémon ressort de la ball
    setState(ghost, "escape");
    ghost.classList.remove("hidden");

    await waitForAnim(ghost, 600);

    // Remettre le vrai sprite visible une fois le ghost arrivé à sa position
    if (sprite) sprite.style.visibility = "visible";
    ghost.classList.add("hidden");
    setState(ghost, null);

    // Ball tombe
    setState(ballWrap, "escape-fall");

    shadow.classList.remove("shadow-visible");
    shadow.classList.add("shadow-gone");

    await waitForAnim(ballWrap, 600);

    // Message
    await showSplashText("Oh non ! Il s'est échappé !", 1500);
}

export async function playCaptureSequence(isCaught, chancePercent, ballObj, pokemonObj) {
    const ballName = ballObj?.name ?? "pokeball";
    const stage    = document.getElementById("cap-stage");

    // Réinitialiser
    stage.classList.remove("hidden");
    document.getElementById("cap-message").className = "hidden";
    document.getElementById("cap-ball-wrap").style.removeProperty("--cap-zoom");

    // Capturer la position du Pokémon UNE SEULE FOIS avant tout
    const pokeCenter = getPokemonCenter();

    await showSplashText("Go !", 400);

    await phaseThrow(ballName);
    await phaseAbsorb(pokeCenter);
    await phaseFall();
    const shakeCount = await phaseShake(isCaught, chancePercent);

    if (isCaught) {
        await phaseSuccess(shakeCount);
    } else {
        await phaseEscape(shakeCount);
    }

    // Nettoyage final
    await wait(400);
    if (!isCaught) {
        stage.classList.add("hidden");
        const ballWrap    = document.getElementById("cap-ball-wrap");

        setState(ballWrap, 'ready');
        // Remettre le sprite visible en cas d'oubli
        const sprite = document.getElementById("pokemon-sprite");
        if (sprite) sprite.style.visibility = "visible";

    }

}