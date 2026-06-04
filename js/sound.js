const GLOBAL_VOLUME = 0.3; // Volume global pour tous les sons (entre 0.0 et 1.0)
const GLOBAL_MUSIC_VOLUME = 0.2; // Volume spécifique pour la musique de chasse (plus bas que les effets)
let Music = null;

export function playCry(pokemon) {
  const url = chrome.runtime.getURL(`assets/cries/${pokemon.id}.ogg`);
  const audio = new Audio(url);

  audio.onerror = () => {
    console.warn("Cry introuvable:", pokemon.id);
  };

  audio.play().catch(() => {});
}


export function startMusic(type) {
    stopMusic();
    let nbMusic = 4;
    let path = "routes";
    if (type === "hunt") {
        path = "routes";
        nbMusic = 4;
    }
    else if (type === "capture") {
        path = "fight";
        nbMusic = 0;
    }
    else if (type === "rare_capture") {
        path = "rare_fight";
        nbMusic = 0;
    }

    const randomMusic = Math.floor(Math.random() * nbMusic);
    
    Music = new Audio(
        chrome.runtime.getURL(`assets/${path}/${randomMusic}.mp3`)
    );

    Music.loop = true;
    Music.volume = GLOBAL_MUSIC_VOLUME;

    Music.play().catch(err => {
        console.error("Impossible de lancer la musique :", err);
        Music = null;
    });
}

export function stopMusic() {
  if (!Music) return;

  Music.pause();
  Music.currentTime = 0;
  Music = null;
}

export function playShiny() {  // Bruit d'étoile
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    // Fréquences des petites clochettes cristallines
    const frequencies = [1046.50, 1318.51, 1567.98, 2093.00, 2637.02, 3135.96];
    
    // --- RÉGLAGE DU VOLUME MAXIMUM (Entre 0.1 et 1.0) ---
    const maxVolume = 0.5; 

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

export function playSuspenseSound(rarity, durationMs) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const duration = durationMs / 1000; // Temps en secondes
    const now = ctx.currentTime;

    // --- 1. LE NOEUD MASTER (Contrôle global et lissage de fin) ---
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(1, now + 0.15); // Entrée en douceur (150ms)
    masterGain.gain.setValueAtTime(1, now + duration - 0.05);
    masterGain.gain.linearRampToValueAtTime(0, now + duration); // Fondu de sortie de 50ms pour éviter le craquement brusque

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
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 0.8);

    // --- RÉGLAGE DU VOLUME DU BOOM ---
    const boomVolume = 1.0; // Augmenté (était à 0.4). Tu peux tester 1.2 si besoin.
    
    gainNode.gain.setValueAtTime(boomVolume, now);
    // On rallonge l'extinction à 1.2s pour que la vibration dure un peu plus longtemps
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1.2); 

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 1.2);
}

export function playWhooshSound() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
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
    const whooshVolume = 0.6; // Augmenté (était à 0.2)

    gainNode.gain.setValueAtTime(0, now);
    // C'est cette ligne qui gère le pic de volume du whoosh :
    gainNode.gain.linearRampToValueAtTime(whooshVolume, now + 0.06); 
    gainNode.gain.linearRampToValueAtTime(0, now + duration); 

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + duration);
}

let rummageTimer;

// Fonction qui génère un court bruit de froissement
export function playRustle() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const bufferSize = audioCtx.sampleRate * 0.1; // 100 millisecondes
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Génération de bruit blanc
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    
    // On filtre le son pour enlever les aigus agressifs (effet "tissu/sac")
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    // Fréquence aléatoire pour que chaque froissement soit unique
    filter.frequency.value = Math.random() * 800 + 400; 
    
    // On gère le volume (attaque rapide, fondu rapide)
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    
    // Connexions
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    
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

// --- GÉNÉRATEUR DE SON : COUP / IMPACT ---
export function playHitSound(hpPercent) {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    // Le volume augmente plus la vie baisse (1 - hpPercent)
    const intensity = 1 - hpPercent;
    gain.gain.setValueAtTime(GLOBAL_VOLUME + (intensity * 0.5), ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    
    osc.type = 'sawtooth';
    // La fréquence devient plus grave et percutante quand la vie est basse
    osc.frequency.setValueAtTime(150 - (intensity * 100), ctx.currentTime);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
}