import { getVolumesParam } from '../settingsUtils.js';

let GLOBAL_VOLUME = null;
let GLOBAL_MUSIC_VOLUME = null;
let GLOBAL_SFX_VOLUME = null;

export async function setGlobalVolume() {
    const volumes = await getVolumesParam();

    const g = parseFloat(volumes.globalVolume);
    const m = parseFloat(volumes.musicVolume);
    const s = parseFloat(volumes.sfxVolume);

    GLOBAL_VOLUME       = isFinite(g) ? g * 0.3 : 0.3;
    GLOBAL_MUSIC_VOLUME = isFinite(m) ? m * 0.3 : 0.3;
    GLOBAL_SFX_VOLUME   = isFinite(s) ? s * 0.3 : 0.3;

    GLOBAL_SFX_VOLUME   *= GLOBAL_VOLUME;
    GLOBAL_MUSIC_VOLUME *= GLOBAL_VOLUME;
}

async function ensureVolumes() {
    await setGlobalVolume();
}

let ctx = null;

export async function playCry(pokemon) {
    await ensureVolumes();
    const url = chrome.runtime.getURL(`assets/cries/${pokemon.id}.ogg`);
    const audio = new Audio(url);

    audio.onerror = () => {
        console.warn("Cry introuvable:", pokemon.id);
    };

    audio.volume = GLOBAL_SFX_VOLUME * 1;
    audio.play().catch(() => {});
}

const sfxCache = new Map();

export function preloadSfx(name) {
    const url = chrome.runtime.getURL(`assets/sfx/${name}.mp3`);
    const audio = new Audio(url);
    audio.preload = "auto";
    sfxCache.set(name, audio);
}

export async function playSfx(name) {
    await ensureVolumes();
    let base = sfxCache.get(name);

    if (!base) {
        preloadSfx(name);
        base = sfxCache.get(name);
    }

    const clone = base.cloneNode();
    clone.volume = GLOBAL_SFX_VOLUME;
    clone.play().catch(() => {});
}

export async function playShiny() {  // Bruit d'étoile
    await ensureVolumes();
    if(!ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        ctx = new AudioContext();
    }

    // Fréquences des petites clochettes cristallines
    const frequencies = [1046.50, 1318.51, 1567.98, 2093.00, 2637.02, 3135.96];
    
    // --- RÉGLAGE DU VOLUME MAXIMUM (Entre 0.1 et 1.0) ---
    const maxVolume = GLOBAL_SFX_VOLUME; 

    frequencies.forEach((freq, index) => {
        // On accélère un poil le rythme (50ms au lieu de 60ms) pour cumuler la puissance des notes
        const startTime = ctx.currentTime + (index * 0.05);

        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        // 'triangle' donne ce grain rétro "Game Boy" hyper percutant
        osc.type = 'square'; 
        osc.frequency.setValueAtTime(freq, startTime);

        // Enveloppe sonore modifiée pour claquer plus fort
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(maxVolume, startTime + 0.01); 
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.4); // Résonne un peu plus longtemps

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.4);
    });
}

export async function playSuspenseSound(rarity, durationMs) {
    await ensureVolumes();
    if(!ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        ctx = new AudioContext();
    }
    const duration = durationMs / 1000; // Temps en secondes
    const now = ctx.currentTime;

    // --- 1. LE NOEUD MASTER (Contrôle global et lissage de fin) ---
    const masterGain = ctx.createGain();
    const globalVol = GLOBAL_SFX_VOLUME*1.5;
    console.log("globalVol:", globalVol);
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(globalVol, now + 0.15);
    masterGain.gain.setValueAtTime(globalVol, now + duration - 0.05);
    masterGain.gain.linearRampToValueAtTime(0, now + duration);

    // --- CONFIGURATION SÉRIEUSE SELON RARETÉ ---
    let baseFreq = 70;       // Plus bas = plus lourd
    let targetFreq = 180;   // Fréquence max (on reste très bas pour éviter le côté aigu)
    let wobbleStart = 3;    // Vitesse du "wom-wom" au début (en Hz)
    let wobbleEnd = 10;     // Vitesse du "wom-wom" à la fin (accélération)
    let volume = 0.25;

    if (rarity === 'rare') {
        baseFreq = 65; targetFreq = 220; wobbleStart = 4; wobbleEnd = 14; volume = 0.3;
    } else if (rarity === 'epic') {
        baseFreq = 55; targetFreq = 280; wobbleStart = 5; wobbleEnd = 18; volume = 0.35;
    } else if (rarity === 'legendary') {
        baseFreq = 45; targetFreq = 320; wobbleStart = 6; wobbleEnd = 24; volume = 0.4;
    }

    // --- 2. DOUBLE OSCILLATEUR (Effet "Wall of Sound" épais) ---
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const synthGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc1.type = 'sawtooth'; // Base agressive...
    osc2.type = 'sawtooth';
    
    // Le secret : on désaccorde légèrement les deux (un un peu plus haut, un un peu plus bas)
    osc1.detune.setValueAtTime(-12, now); 
    osc2.detune.setValueAtTime(12, now);

    // Montée en fréquence linéaire (beaucoup moins brusque que l'exponentielle)
    osc1.frequency.setValueAtTime(baseFreq, now);
    osc1.frequency.linearRampToValueAtTime(targetFreq, now + duration);
    osc2.frequency.setValueAtTime(baseFreq, now);
    osc2.frequency.linearRampToValueAtTime(targetFreq, now + duration);

    // --- 3. FILTRE ET LFO (La pulsation magique) ---
    filter.type = 'lowpass'; // On coupe tous les aigus désagréables
    filter.frequency.setValueAtTime(100, now);
    filter.frequency.linearRampToValueAtTime(rarity === 'legendary' ? 600 : 400, now + duration);
    filter.Q.setValueAtTime(4, now); // Donne une couleur plus "sci-fi" au filtre

    // LFO : L'oscillateur invisible qui fait varier le filtre pour créer le "wom-wom"
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(wobbleStart, now);
    lfo.frequency.linearRampToValueAtTime(wobbleEnd, now + duration); // Le rythme s'accélère !

    // Intensité de la pulsation
    lfoGain.gain.setValueAtTime(40, now);
    lfoGain.gain.linearRampToValueAtTime(150, now + duration);

    // Connexion du LFO au filtre
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    // Gestion du volume de cette couche
    synthGain.gain.setValueAtTime(0, now);
    synthGain.gain.linearRampToValueAtTime(volume, now + duration * 0.7);

    // Connexions de la couche Synthé
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(synthGain);
    synthGain.connect(masterGain);

    // --- 4. LE SUB-BASS (La lourdeur physique) ---
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    
    subOsc.type = 'sine'; // Onde pure parfaite pour les basses de home-cinéma
    subOsc.frequency.setValueAtTime(baseFreq, now);
    subOsc.frequency.linearRampToValueAtTime(baseFreq * 1.5, now + duration);

    subGain.gain.setValueAtTime(0, now);
    subGain.gain.linearRampToValueAtTime(volume * 1.3, now + duration * 0.8);

    subOsc.connect(subGain);
    subGain.connect(masterGain);

    // --- 5. BRANCHEMENT FINAL AU CASQUE/HAUT-PARLEURS ---
    masterGain.connect(ctx.destination);

    // Start
    osc1.start(now);
    osc2.start(now);
    lfo.start(now);
    subOsc.start(now);

    // Stop
    osc1.stop(now + duration);
    osc2.stop(now + duration);
    lfo.stop(now + duration);
    subOsc.stop(now + duration);
}

export function playImpactBoom() {
    if(!ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        ctx = new AudioContext();
    }
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 0.8);

    // --- RÉGLAGE DU VOLUME DU BOOM ---
    const boomVolume = GLOBAL_SFX_VOLUME * 10; // Augmenté (était à 0.4). Tu peux tester 1.2 si besoin.
    
    gainNode.gain.setValueAtTime(boomVolume, now);
    // On rallonge l'extinction à 1.2s pour que la vibration dure un peu plus longtemps
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1.2); 

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 1.2);
}

export function playWhooshSound() {
    if(!ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        ctx = new AudioContext();
    }
    const now = ctx.currentTime;
    const duration = 0.35; // Légèrement rallongé (350ms) pour donner plus de corps

    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass'; 
    filter.frequency.setValueAtTime(3500, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + duration);
    
    // On augmente le facteur Q (la résonance) pour rendre le vent plus tranchant
    filter.Q.setValueAtTime(8, now); 

    const gainNode = ctx.createGain();
    
    // --- RÉGLAGE DU VOLUME DU WHOOSH --- 
    const whooshVolume = GLOBAL_SFX_VOLUME * 2;

    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.linearRampToValueAtTime(whooshVolume, now + 0.06);
    gainNode.gain.linearRampToValueAtTime(0.0001, now + duration);

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + duration);
}

let rummageTimer;

// Fonction qui génère un court bruit de froissement
function playRustle() {
    if(!ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        ctx = new AudioContext();
    }
    if (ctx.state === 'suspended') ctx.resume();
    
    const bufferSize = ctx.sampleRate * 0.1; // 100 millisecondes
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Génération de bruit blanc
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    // On filtre le son pour enlever les aigus agressifs (effet "tissu/sac")
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    // Fréquence aléatoire pour que chaque froissement soit unique
    filter.frequency.value = Math.random() * 800 + 400; 
    
    // On gère le volume (attaque rapide, fondu rapide)
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3 * GLOBAL_SFX_VOLUME * 5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01 * GLOBAL_SFX_VOLUME * 5, ctx.currentTime + 0.1);
    
    // Connexions
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    noise.start();
}

// Boucle qui déclenche les froissements de manière chaotique
export function startRummageSound() {
    const trigger = () => {
        playRustle();
        // Relance un bruit entre 50ms et 150ms plus tard
        rummageTimer = setTimeout(trigger, Math.random() * 100 + 50);
    };
    trigger();
}
// Fonction pour tout couper
export const stopRummageSound = () => {
    clearTimeout(rummageTimer);
};

// Fonction utilitaire pour créer une distorsion de type "clipping" (saturation arcade)
function makeDistortionCurve(amount = 50) {
    const k = typeof amount === 'number' ? amount : 50;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
        const x = (i * 2) / n_samples - 1;
        curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
}

export function playHitSound(hpPercent, isFinalHit = false) {
    if (!ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        ctx = new AudioContext();
    }
    const now = ctx.currentTime;
    const intensity = 1 - hpPercent;

    if (isFinalHit) {
        // --- COUP FINAL (CONSERVE TON SUB-BOOM EXPLOSIF) ---
        const oscFinal = ctx.createOscillator();
        const gainFinal = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        oscFinal.type = 'sawtooth';
        oscFinal.frequency.setValueAtTime(350, now);
        oscFinal.frequency.exponentialRampToValueAtTime(20, now + 0.6);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(500, now);
        
        gainFinal.gain.setValueAtTime(GLOBAL_SFX_VOLUME * 2, now);
        gainFinal.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        
        oscFinal.connect(filter);
        filter.connect(gainFinal);
        gainFinal.connect(ctx.destination);
        
        oscFinal.start(now);
        oscFinal.stop(now + 0.8);
        playNoiseBuffer(ctx, now, 0.5, 0.6);
    } else {
        // ==========================================
        // 🥊 LE COUP NORMAL VERSION "IMPACT BRUTAL"
        // ==========================================

        // --- COUCHE 1 : LE CRACK INITIAL (OVERSHOOT ULTRA-SEC) ---
        const oscCrack = ctx.createOscillator();
        const gainCrack = ctx.createGain();
        const distortion = ctx.createWaveShaper();

        oscCrack.type = 'square'; // L'onde carrée est la plus agressive et brute
        oscCrack.frequency.setValueAtTime(1800, now); // Fréquence très haute pour le claquement
        
        // CONFIGURATION DISTORSION (Le secret du côté "Brusque")
        distortion.curve = makeDistortionCurve(80); // Grosse saturation
        distortion.oversample = '4x';

        // Énorme pic de volume (2.5x le volume global) qui s'effondre en 0.008s (8ms)
        const peakVol = GLOBAL_SFX_VOLUME * 5 + (intensity * 0.3) * 2.5;
        gainCrack.gain.setValueAtTime(peakVol, now);
        gainCrack.gain.exponentialRampToValueAtTime(0.001, now + 0.01); // Disparaît instantanément

        oscCrack.connect(distortion);
        distortion.connect(gainCrack);
        gainCrack.connect(ctx.destination);

        oscCrack.start(now);
        oscCrack.stop(now + 0.05);

        // --- COUCHE 2 : L'ONDE DE CHOC (BASS THUMP) ---
        const oscThump = ctx.createOscillator();
        const gainThump = ctx.createGain();
        
        oscThump.type = 'triangle';
        const randomPitch = (Math.random() * 30) - 15;
        const baseFreq = 180 - (intensity * 80) + randomPitch;
        
        oscThump.frequency.setValueAtTime(baseFreq, now);
        oscThump.frequency.exponentialRampToValueAtTime(baseFreq * 0.3, now + 0.08);
        
        // Volume du corps du son (normalisé)
        gainThump.gain.setValueAtTime(GLOBAL_SFX_VOLUME * 5 + (intensity * 0.4), now);
        gainThump.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        
        oscThump.connect(gainThump);
        gainThump.connect(ctx.destination);
        
        oscThump.start(now);
        oscThump.stop(now + 0.12);

        // --- COUCHE 3 : LE SOUFFLE DE L'IMPACT ---
        playNoiseBuffer(ctx, now, (GLOBAL_SFX_VOLUME * 5 + (intensity * 0.2)) * 0.4, 0.04);
    }
}

// Laisse ta fonction playNoiseBuffer identique à la précédente
function playNoiseBuffer(ctx, startTime, volume, duration) {
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) { data[i] = Math.random() * 2 - 1; }
    const noiseNode = ctx.createBufferSource();
    noiseNode.buffer = buffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(volume, startTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1200, startTime);
    noiseNode.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseNode.start(startTime);
    noiseNode.stop(startTime + duration);
}

let currentTargetingGain = null;
let targetingInterval = null;

export function startTargetingSound(config) {
    const playTargetingPulse = () => {
        if (!ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            ctx = new AudioContext();
        }
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        // Onde en dents de scie (sawtooth) pour le côté laser/électrique
        osc.type = 'sawtooth';
        
        // 📈 LE PITCH MONTE : Commence bas (tension), monte aigu (aligné sur l'anneau qui rétrécit)
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(config.pitchMax, now + (config.duration * 0.8));
        
        // FILTRE PASSE-BAS évolutif pour ouvrir le son au fur et à mesure
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + config.duration);
        
        // GESTION DU VOLUME : Léger crescendo pour accentuer l'urgence
        gainNode.gain.setValueAtTime(0.001, now);
        gainNode.gain.linearRampToValueAtTime(GLOBAL_VOLUME * 1.5, now + 0.2); // Entrée douce
        gainNode.gain.linearRampToValueAtTime(GLOBAL_VOLUME * 2, now + 0.9); // Pic de tension
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.2);          // Chute si pas cliqué

        // Connexions
        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);
        gainNode.gain.value = GLOBAL_SFX_VOLUME * 2;

        osc.start(now);
        osc.stop(now + config.duration);
        
        // On garde une référence du gain actuel pour pouvoir le couper proprement au clic
        currentTargetingGain = gainNode;
    };

    // Lance le premier cycle immédiatement
    playTargetingPulse();
    // Boucle toutes les 1200ms (Pile le temps de l'animation CSS !)
    targetingInterval = setInterval(playTargetingPulse, config.duration * 1000);
}

/**
 * Coupe instantanément et proprement le son d'attente
 */
export function stopTargetingSound() {
    // On nettoie l'intervalle pour stopper la boucle
    if (targetingInterval) {
        clearInterval(targetingInterval);
        targetingInterval = null;
    }

    // 🛡️ SÉCURITÉ ANTI-POP : Fondu de fermeture éclair (50ms)
    if (currentTargetingGain && ctx) {
        const now = ctx.currentTime;
        try {
            currentTargetingGain.gain.setValueAtTime(currentTargetingGain.gain.value, now);
            currentTargetingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        } catch(e) { /* Sécurité si le nœud est déjà mort */ }
    }
}