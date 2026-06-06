// ============================================================
//  DEFENSE MINI-GAME ENGINE — defense-engine.js
//  Chaque type de Pokémon déclenche un mini-jeu unique.
//  Le joueur contrôle une Pokéball via la souris.
// ============================================================

import { showSplashText } from "../battle-annimation.js";

// ─── CONSTANTES GLOBALES ─────────────────────────────────────
const ARENA_W = 600;
const ARENA_H = 400;
const PLAYER_RADIUS = 16; // rayon de collision de la Pokéball

// ─── BASE DE DONNÉES DES ATTAQUES PAR TYPE ───────────────────
//
//  Chaque entrée décrit :
//   • attackName  : nom affiché façon Pokémon
//   • color       : couleur dominante
//   • accent      : couleur secondaire / highlight
//   • duration    : durée en ms
//   • mechanic    : identifiant de la mécanique de jeu
//   • theme       : classe CSS appliquée à l'arène
//   • description : sous-titre affiché au lancement
//
export const ATTACK_CONFIGS = {

  // 🔥 FEU — anneaux de feu qui se propagent vers l'extérieur
  fire: {
    attackName: "Déflagration",
    color: "#ff4500",
    accent: "#ffaa00",
    duration: 6000,
    mechanic: "fire_rings",
    theme: "theme-fire",
    description: "Esquive les anneaux de flammes !"
  },

  // 💧 EAU — jets horizontaux qui balaient l'arène
  water: {
    attackName: "Hydrocanon",
    color: "#38bdf8",
    accent: "#bfdbfe",
    duration: 6000,
    mechanic: "water_sweep",
    theme: "theme-water",
    description: "Évite les jets d'eau dévastateurs !"
  },

  // ⚡ ÉLECTRIK — éclairs qui frappent des zones aléatoires
  electric: {
    attackName: "Fatal-Foudre",
    color: "#facc15",
    accent: "#fff176",
    duration: 5000,
    mechanic: "electric_bolts",
    theme: "theme-electric",
    description: "Ne reste pas dans les zones surlignées !"
  },

  // 🌿 PLANTE — lianes qui traversent l'arène
  grass: {
    attackName: "Tranch'Herbe",
    color: "#4ade80",
    accent: "#bbf7d0",
    duration: 6000,
    mechanic: "grass_vines",
    theme: "theme-grass",
    description: "Évite les lianes tranchantes !"
  },

  // ❄️ GLACE — projectiles qui ralentissent + gel progressif
  ice: {
    attackName: "Blizzard",
    color: "#a5f3fc",
    accent: "#e0f2fe",
    duration: 7000,
    mechanic: "ice_freeze",
    theme: "theme-ice",
    description: "Évite de te faire geler !"
  },

  // 🌍 SOL — ondes de choc qui irradient depuis le sol
  ground: {
    attackName: "Séisme",
    color: "#a16207",
    accent: "#fde68a",
    duration: 6000,
    mechanic: "ground_shockwaves",
    theme: "theme-ground",
    description: "Saute par-dessus les ondes sismiques !"
  },

  // 🪨 ROCHE — météorites massives
  rock: {
    attackName: "Éboulement",
    color: "#78716c",
    accent: "#e7e5e4",
    duration: 6000,
    mechanic: "rock_boulders",
    theme: "theme-rock",
    description: "Évite les rochers qui tombent !"
  },

  // 💨 VOL — rafales qui dévient ta trajectoire
  flying: {
    attackName: "Aéropique",
    color: "#bae6fd",
    accent: "#ffffff",
    duration: 6000,
    mechanic: "flying_gusts",
    theme: "theme-flying",
    description: "Résiste aux courants aériens !"
  },

  // 🧠 PSY — contrôles inversés + zones d'illusion
  psychic: {
    attackName: "Psyko",
    color: "#f472b6",
    accent: "#fce7f3",
    duration: 5000,
    mechanic: "psychic_distort",
    theme: "theme-psychic",
    description: "Ton esprit est retourné... !"
  },

  // 🐛 INSECTE — essaim en formation qui progresse
  bug: {
    attackName: "Dard-Nuée",
    color: "#a3e635",
    accent: "#ecfccb",
    duration: 6000,
    mechanic: "bug_swarm",
    theme: "theme-bug",
    description: "Échappe au nuage d'insectes !"
  },

  // 👻 SPECTRE — obscurité totale + zones mortelles invisibles
  ghost: {
    attackName: "Ténèbres",
    color: "#7c3aed",
    accent: "#c4b5fd",
    duration: 6000,
    mechanic: "ghost_dark",
    theme: "theme-ghost",
    description: "Survie dans l'obscurité totale !"
  },

  // 🐉 DRAGON — spirale de météores
  dragon: {
    attackName: "Draco-Météor",
    color: "#6366f1",
    accent: "#c7d2fe",
    duration: 6000,
    mechanic: "dragon_spiral",
    theme: "theme-dragon",
    description: "Échappe à la spirale cosmique !"
  },

  // 🌑 TÉNÈBRES — zones aléatoires qui explosent avec délai
  dark: {
    attackName: "Jackpot Sombre",
    color: "#1e1b4b",
    accent: "#818cf8",
    duration: 6000,
    mechanic: "dark_mines",
    theme: "theme-dark",
    description: "Ne reste pas sur les zones maudites !"
  },

  // ⚙️ ACIER — plaques qui se ferment depuis les bords
  steel: {
    attackName: "Poing-Éclair",
    color: "#94a3b8",
    accent: "#e2e8f0",
    duration: 6000,
    mechanic: "steel_walls",
    theme: "theme-steel",
    description: "Échappe aux murs d'acier !"
  },

  // 🧪 POISON — nuage toxique qui envahit l'arène
  poison: {
    attackName: "Toxic",
    color: "#a855f7",
    accent: "#e9d5ff",
    duration: 6000,
    mechanic: "poison_cloud",
    theme: "theme-poison",
    description: "Évite les zones empoisonnées !"
  },

  // 🥊 COMBAT — poing géant qui smash des zones
  fighting: {
    attackName: "Mégapoing",
    color: "#f97316",
    accent: "#fed7aa",
    duration: 5000,
    mechanic: "fighting_punches",
    theme: "theme-fighting",
    description: "Esquive les coups !"
  },

  // 🌟 FÉE — cercles enchantés qui explosent
  fairy: {
    attackName: "Blizzard Féerique",
    color: "#ec4899",
    accent: "#fbcfe8",
    duration: 6000,
    mechanic: "fairy_circles",
    theme: "theme-fairy",
    description: "Évite les cercles enchantés !"
  },

  // 🌋 NORMAL — projectiles classiques (fallback)
  normal: {
    attackName: "Morsure",
    color: "#a8a29e",
    accent: "#e7e5e4",
    duration: 5000,
    mechanic: "normal_drops",
    theme: "theme-normal",
    description: "Esquive les projectiles !"
  }
};

// ─── ÉTAT GLOBAL DU MOTEUR ───────────────────────────────────
let _raf = null;
let _intervals = [];
let _timeouts = [];
let _objects = [];    // projectiles / zones actifs
let _isOver = false;
let _arena = null;
let _player = null;
let _playerX = ARENA_W / 2;
let _playerY = ARENA_H / 2;
let _mouseX  = ARENA_W / 2;
let _mouseY  = ARENA_H / 2;
let _friction = 0.25;
let _windX = 0;
let _windY = 0;
let _invertControls = false;
let _freezeTimer = 0;      // secondes restantes de gel
let _freezeMax   = 0;
let _resolve = null;
let _particlePool = [];    // pool de particules réutilisables

// ─── HELPERS ─────────────────────────────────────────────────

function _addInterval(fn, ms) {
  const id = setInterval(fn, ms);
  _intervals.push(id);
  return id;
}
function _addTimeout(fn, ms) {
  const id = setTimeout(fn, ms);
  _timeouts.push(id);
  return id;
}
function _rnd(min, max) { return Math.random() * (max - min) + min; }
function _rndInt(min, max) { return Math.floor(_rnd(min, max + 1)); }

// ─── PARTICULES : POOL & SPAWN ────────────────────────────────
function _spawnParticle(x, y, { color = "#fff", size = 6, vx = 0, vy = 0, life = 600, shape = "circle", glow = true } = {}) {
  const el = document.createElement("div");
  el.className = "dp-particle";
  el.style.cssText = `
    position:absolute;
    width:${size}px; height:${size}px;
    background:${color};
    border-radius:${shape === "circle" ? "50%" : shape === "star" ? "2px" : "3px"};
    left:${x}px; top:${y}px;
    pointer-events:none;
    transform:translate(-50%,-50%) rotate(${shape === "star" ? "45deg" : "0"});
    ${glow ? `box-shadow:0 0 ${size * 1.5}px ${color};` : ""}
    z-index:10;
  `;
  _arena.appendChild(el);

  const start = performance.now();
  const particle = { el, x, y, vx, vy, life, start };
  _particlePool.push(particle);
}

function _burstParticles(x, y, count, color, accent) {
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const speed = _rnd(2, 8);
    _spawnParticle(x, y, {
      color: Math.random() < 0.6 ? color : accent,
      size: _rnd(4, 10),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: _rnd(400, 800),
      glow: true
    });
  }
}

function _updateParticles(now) {
  for (let i = _particlePool.length - 1; i >= 0; i--) {
    const p = _particlePool[i];
    const elapsed = now - p.start;
    const progress = elapsed / p.life;
    if (progress >= 1) {
      p.el.remove();
      _particlePool.splice(i, 1);
      continue;
    }
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.15; // gravité légère
    p.vx *= 0.97; // friction air
    const opacity = 1 - progress;
    p.el.style.left = `${p.x}px`;
    p.el.style.top  = `${p.y}px`;
    p.el.style.opacity = opacity;
    p.el.style.transform = `translate(-50%,-50%) scale(${1 - progress * 0.5})`;
  }
}

// ─── RENDU JOUEUR (Pokéball) ──────────────────────────────────
function _renderPlayer() {
  _player.style.left  = `${_playerX}px`;
  _player.style.top   = `${_playerY}px`;

  // Rotation au mouvement
  const dx = _mouseX - _playerX;
  const rot = dx * 0.5;
  _player.style.transform = `translate(-50%, -50%) rotate(${rot}deg)`;

  // Gel visuel
  if (_freezeTimer > 0) {
    const pct = _freezeTimer / _freezeMax;
    _player.style.filter = `saturate(${1 - pct * 0.8}) brightness(${1 - pct * 0.4}) hue-rotate(${pct * 180}deg)`;
    _player.style.boxShadow = `0 0 ${pct * 30}px #a5f3fc, 0 0 ${pct * 50}px #e0f2fe`;
  } else {
    _player.style.filter = "";
    _player.style.boxShadow = "0 0 12px rgba(255,255,255,0.4)";
  }
}

// ─── SCREEN-SHAKE ─────────────────────────────────────────────
function _screenShake(intensity = 8, duration = 300) {
  const container = document.getElementById("defense-stage");
  if (!container) return;
  const start = performance.now();
  function shake(now) {
    const t = now - start;
    if (t > duration) { container.style.transform = ""; return; }
    const decay = 1 - (t / duration);
    const sx = (Math.random() - 0.5) * intensity * 2 * decay;
    const sy = (Math.random() - 0.5) * intensity * 2 * decay;
    container.style.transform = `translate(${sx}px, ${sy}px)`;
    requestAnimationFrame(shake);
  }
  requestAnimationFrame(shake);
}

// ─── FLASH D'ARÈNE ────────────────────────────────────────────
function _arenaFlash(color, duration = 150) {
  const overlay = document.getElementById("arena-flash-overlay");
  if (!overlay) return;
  overlay.style.background = color;
  overlay.style.opacity = "0.35";
  setTimeout(() => { overlay.style.opacity = "0"; }, duration);
}

// ─── AFFICHAGE ATTAQUE ────────────────────────────────────────
function _showAttackName(name, color) {
  const el = document.getElementById("attack-name-display");
  if (!el) return;
  el.textContent = name.toUpperCase();
  el.style.color = color;
  el.style.textShadow = `0 0 20px ${color}, 0 0 40px ${color}`;
  el.classList.remove("attack-name-enter");
  void el.offsetWidth; // force reflow
  el.classList.add("attack-name-enter");
}

// ─── BARRE DE VIE RESTANT ─────────────────────────────────────
function _updateSurvivalBar(elapsed, total) {
  const bar = document.getElementById("survival-bar-fill");
  if (!bar) return;
  const pct = Math.max(0, 1 - (elapsed / total));
  bar.style.width = `${pct * 100}%`;
  if (pct > 0.5) bar.style.background = "#22c55e";
  else if (pct > 0.25) bar.style.background = "#f59e0b";
  else bar.style.background = "#ef4444";
}

// ─── NETTOYAGE ────────────────────────────────────────────────
function _cleanup() {
  cancelAnimationFrame(_raf);
  _intervals.forEach(clearInterval);
  _timeouts.forEach(clearTimeout);
  _intervals = [];
  _timeouts  = [];
  _objects.forEach(o => o.el && o.el.remove && o.el.remove());
  _objects = [];
  _particlePool.forEach(p => p.el && p.el.remove());
  _particlePool = [];
  // supprimer tous les éléments de jeu injectés dans l'arène
  if (_arena) {
    _arena.querySelectorAll(".dp-particle,.dp-projectile,.dp-zone,.dp-vine,.dp-ring,.dp-gust,.dp-mine,.dp-swarm,.dp-wall,.dp-cloud").forEach(e => e.remove());
  }
  if (_player) {
    _player.style.filter = "";
    _player.style.boxShadow = "";
    _player.style.transform = "translate(-50%,-50%)";
  }
  _windX = 0;
  _windY = 0;
  _invertControls = false;
  _freezeTimer = 0;
  _isOver = false;
  _arena = null;
  _player = null;
}

// ─── DÉTECTION DE COLLISION (cercle / rect) ───────────────────
function _hitCircle(ax, ay, ar, bx, by, br) {
  return Math.hypot(ax - bx, ay - by) < ar + br;
}
function _hitRect(px, py, pr, rx, ry, rw, rh) {
  const cx = Math.max(rx, Math.min(px, rx + rw));
  const cy = Math.max(ry, Math.min(py, ry + rh));
  return Math.hypot(px - cx, py - cy) < pr;
}

// ============================================================
//   MÉCANIQUES DE JEU (une par type)
// ============================================================

// ─── 🔥 FEU : anneaux concentriques qui explosent vers l'extérieur
function _mechanic_fire_rings(cfg, difficulty) {
  const colors = [cfg.color, cfg.accent, "#ff6a00"];
  let spawnDelay = Math.max(800, 2000 - difficulty * 200);

  function spawnRing() {
    if (_isOver) return;
    // Taille de départ et vitesse d'expansion
    const spawnDelay = Math.max(15, 60 - difficulty * 10);   // temps avant expension en image
    const startSize = _rnd(20, 60);                         // taille de départ
    const maxSize = startSize * 2 * (1 + difficulty * 0.5); // taille maximale
    const expandSpeed = _rnd(2, 4) * (1 + difficulty * 0.1);// vitesse d'expansion
    const color = colors[_rndInt(0, colors.length - 1)];    // couleur

    const el = document.createElement("div");
    el.className = "dp-ring dp-projectile";
    const cx = _rnd(80, ARENA_W - 80);
    const cy = _rnd(60, ARENA_H - 60);
    el.style.cssText = `
      position:absolute;
      width:${startSize}px; height:${startSize}px;
      border-radius:50%;
      border: 4px solid ${color};
      box-shadow: 0 0 12px ${color}, inset 0 0 8px ${color};
      left:${cx}px; top:${cy}px;
      transform:translate(-50%,-50%);
      pointer-events:none;
    `;
    _arena.appendChild(el);

    // Petite explosion de particules au spawn
    _burstParticles(cx, cy, 8, cfg.color, cfg.accent);
    _arenaFlash(cfg.color, 80);

    const obj = { el, cx, cy, r: startSize / 2, expandSpeed, type: "ring", alive: true, maxSize, spawnDelay };
    _objects.push(obj);

    // Particules de feu qui brûlent le long de l'anneau
    const trailInterval = setInterval(() => {
      if (!obj.alive || _isOver) { clearInterval(trailInterval); return; }
      const angle = Math.random() * Math.PI * 2;
      _spawnParticle(cx + Math.cos(angle) * obj.r, cy + Math.sin(angle) * obj.r, {
        color: Math.random() < 0.5 ? cfg.color : cfg.accent,
        size: _rnd(3, 8), vx: Math.cos(angle) * _rnd(0.5, 2), vy: _rnd(-3, -1), life: 400
      });
    }, 40);

    _intervals.push(trailInterval);
  }

  const spawnInterval = _addInterval(spawnRing, spawnDelay);
  spawnRing(); // Premier anneau immédiat

  return function update(now) {
    for (let i = _objects.length - 1; i >= 0; i--) {
      const o = _objects[i];
      if (o.type !== "ring" || !o.alive) continue;
      if(o.spawnDelay > 0) { 
        o.spawnDelay -= 1; 
        console.log("spawnDelay:", o.spawnDelay, now);
        _spawnParticle(o.cx, o.cy, { color: cfg.color, size: _rnd(3, 8), vx: 0, vy: 0, life: 100 });
        continue; 
      } 
      o.r += o.expandSpeed;
      const d = o.r * 2;
      if (o.r > o.maxSize) {
        o.el.remove();
        o.alive = false;
        _objects.splice(i, 1);
        continue;
      }
      o.el.style.width  = `${d}px`;
      o.el.style.height = `${d}px`;

      // Collision joueur
      const dist = Math.hypot(_playerX - o.cx, _playerY - o.cy);
      const ringThickness = 12;
      if (Math.abs(dist - o.r) < PLAYER_RADIUS + ringThickness) {
        return true; // TOUCHÉ
      }

      // Sortie d'arène
      if (d > ARENA_H) {
        o.el.remove();
        o.alive = false;
        _objects.splice(i, 1);
      }
    }
    return false;
  };
}

// ─── 💧 EAU : jets horizontaux qui balaient l'arène de haut en bas
function _mechanic_water_sweep(cfg, difficulty) {
  const beamHeight = 18 + difficulty * 2;
  let direction = 1; // 1 = descend, -1 = monte
  let beamY = -beamHeight;
  const beamSpeed = (1.8 + difficulty * 0.3) * direction;

  function spawnBeam() {
    if (_isOver) return;
    direction *= -1;
    beamY = direction > 0 ? -beamHeight : ARENA_H + beamHeight;
    const speed = (1.8 + difficulty * 0.3);

    const el = document.createElement("div");
    el.className = "dp-projectile";
    el.style.cssText = `
      position:absolute;
      width:100%; height:${beamHeight}px;
      left:0; top:${beamY}px;
      background: linear-gradient(90deg,
        transparent 0%, ${cfg.color}cc 20%,
        ${cfg.accent} 50%,
        ${cfg.color}cc 80%, transparent 100%);
      box-shadow: 0 0 20px ${cfg.color}, 0 -4px 10px ${cfg.accent}, 0 4px 10px ${cfg.accent};
      pointer-events:none;
      border-radius: 4px;
    `;
    _arena.appendChild(el);
    // Bulles de spray
    for (let i = 0; i < 12; i++) {
      _addTimeout(() => {
        if (_isOver) return;
        _spawnParticle(_rnd(0, ARENA_W), beamY, {
          color: cfg.accent, size: _rnd(3, 7),
          vx: _rnd(-2, 2), vy: direction * _rnd(1, 4), life: 500
        });
      }, i * 40);
    }

    const obj = { el, y: beamY, vy: direction * speed, w: ARENA_W, h: beamHeight, type: "beam" };
    _objects.push(obj);
  }

  _addInterval(spawnBeam, Math.max(1200, 2500 - difficulty * 200));
  spawnBeam();

  return function update() {
    for (let i = _objects.length - 1; i >= 0; i--) {
      const o = _objects[i];
      if (o.type !== "beam") continue;
      o.y += o.vy;
      o.el.style.top = `${o.y}px`;

      // Particules le long du jet
      if (Math.random() < 0.3) {
        _spawnParticle(_rnd(0, ARENA_W), o.y + o.h / 2, {
          color: cfg.accent, size: _rnd(2, 5),
          vx: _rnd(-1, 1), vy: o.vy * 0.3, life: 250
        });
      }

      if (_hitRect(_playerX, _playerY, PLAYER_RADIUS, 0, o.y, o.w, o.h)) return true;
      if (o.y > ARENA_H + 40 || o.y < -40) { o.el.remove(); _objects.splice(i, 1); }
    }
    return false;
  };
}

// ─── ⚡ ÉLECTRIK : zones qui se téléchargent puis frappent
function _mechanic_electric_bolts(cfg, difficulty) {
  const warningDuration = Math.max(600, 1200 - difficulty * 80);
  const strikeDuration  = 200;

  function spawnBolt() {
    if (_isOver) return;
    const x = _rnd(40, ARENA_W - 40);
    const w = _rnd(30, 60);

    // Phase WARNING (zone jaune clignotante)
    const warn = document.createElement("div");
    warn.className = "dp-zone";
    warn.style.cssText = `
      position:absolute;
      width:${w}px; height:100%;
      left:${x - w / 2}px; top:0;
      background: ${cfg.color}22;
      border-left: 2px solid ${cfg.color}88;
      border-right: 2px solid ${cfg.color}88;
      pointer-events:none;
      animation: electricWarn 0.15s linear infinite alternate;
    `;
    _arena.appendChild(warn);

    _addTimeout(() => {
      if (_isOver) { warn.remove(); return; }
      warn.remove();
      // Phase STRIKE
      const bolt = document.createElement("div");
      bolt.className = "dp-zone";
      bolt.style.cssText = `
        position:absolute;
        width:${w}px; height:100%;
        left:${x - w / 2}px; top:0;
        background: linear-gradient(180deg, transparent, ${cfg.color}ff, transparent);
        box-shadow: 0 0 30px ${cfg.color}, 0 0 60px ${cfg.accent};
        pointer-events:none;
        border-radius: 4px;
      `;
      _arena.appendChild(bolt);
      _arenaFlash(cfg.color, 100);
      _screenShake(5, 200);

      // Éclairs de particules
      for (let i = 0; i < 20; i++) {
        _spawnParticle(x + _rnd(-w, w), _rnd(0, ARENA_H), {
          color: i % 2 === 0 ? cfg.color : "#fff",
          size: _rnd(2, 5), vx: _rnd(-3, 3), vy: _rnd(-3, 3), life: 300
        });
      }

      // Zone de collision active
      const obj = { el: bolt, x: x - w / 2, y: 0, w, h: ARENA_H, type: "strike_zone" };
      _objects.push(obj);

      _addTimeout(() => {
        bolt.remove();
        const idx = _objects.indexOf(obj);
        if (idx > -1) _objects.splice(idx, 1);
      }, strikeDuration);
    }, warningDuration);
  }

  _addInterval(spawnBolt, Math.max(400, 900 - difficulty * 60));
  _addTimeout(spawnBolt, 100);

  return function update() {
    for (const o of _objects) {
      if (o.type !== "strike_zone") continue;
      if (_hitRect(_playerX, _playerY, PLAYER_RADIUS, o.x, o.y, o.w, o.h)) return true;
    }
    return false;
  };
}

// ─── 🌿 PLANTE : lianes traversantes (horizontales & verticales)
function _mechanic_grass_vines(cfg, difficulty) {
  const vineSpeed = 5 + difficulty * 0.6;
  const vineW     = 14 + difficulty;

  function spawnVine(horizontal) {
    if (_isOver) return;
    const el = document.createElement("div");
    el.className = "dp-vine dp-projectile";
    let x, y, vx, vy;

    if (horizontal) {
      y = _rnd(20, ARENA_H - 20);
      x = -20;
      vx = vineSpeed; vy = 0;
      el.style.cssText = `
        position:absolute;
        width:40px; height:${vineW}px;
        left:${x}px; top:${y - vineW / 2}px;
        background: linear-gradient(90deg, transparent, ${cfg.color}, ${cfg.accent}, ${cfg.color});
        box-shadow: 0 0 8px ${cfg.color};
        border-radius:3px; pointer-events:none;
      `;
    } else {
      x = _rnd(20, ARENA_W - 20);
      y = -20;
      vx = 0; vy = vineSpeed;
      el.style.cssText = `
        position:absolute;
        width:${vineW}px; height:40px;
        left:${x - vineW / 2}px; top:${y}px;
        background: linear-gradient(180deg, transparent, ${cfg.color}, ${cfg.accent}, ${cfg.color});
        box-shadow: 0 0 8px ${cfg.color};
        border-radius:3px; pointer-events:none;
      `;
    }
    _arena.appendChild(el);

    const obj = { el, x, y, vx, vy, w: horizontal ? 40 : vineW, h: horizontal ? vineW : 40, horizontal, type: "vine" };
    _objects.push(obj);
  }

  _addInterval(() => spawnVine(true),  Math.max(600, 1400 - difficulty * 100));
  _addInterval(() => spawnVine(false), Math.max(800, 1600 - difficulty * 100));
  spawnVine(true);

  return function update() {
    for (let i = _objects.length - 1; i >= 0; i--) {
      const o = _objects[i];
      if (o.type !== "vine") continue;
      o.x += o.vx; o.y += o.vy;

      // Étirer la liane visuellement
      if (o.horizontal) {
        o.w = Math.min(o.w + o.vx * 0.8, ARENA_W + 40);
        o.el.style.width  = `${o.w}px`;
        o.el.style.left   = `${o.x}px`;
      } else {
        o.h = Math.min(o.h + o.vy * 0.8, ARENA_H + 40);
        o.el.style.height = `${o.h}px`;
        o.el.style.top    = `${o.y}px`;
      }

      // Particules végétales
      if (Math.random() < 0.2) {
        const px = o.horizontal ? o.x + o.w : o.x + o.w / 2;
        const py = o.horizontal ? o.y + o.h / 2 : o.y + o.h;
        _spawnParticle(px, py, {
          color: cfg.accent, size: _rnd(3, 6),
          vx: _rnd(-1.5, 1.5), vy: _rnd(-2, 0), life: 400
        });
      }

      // Collision
      const ox = o.horizontal ? o.x : o.x - o.w / 2;
      const oy = o.horizontal ? o.y - o.h / 2 : o.y;
      if (_hitRect(_playerX, _playerY, PLAYER_RADIUS, ox, oy, o.w, o.h)) return true;

      if (o.x > ARENA_W + 50 || o.y > ARENA_H + 50) {
        o.el.remove(); _objects.splice(i, 1);
      }
    }
    return false;
  };
}

// ─── ❄️ GLACE : projectiles froids + gels qui ralentissent
function _mechanic_ice_freeze(cfg, difficulty) {
  const spawnRate = Math.max(500, 1200 - difficulty * 100);

  function spawnIceShard() {
    if (_isOver) return;
    const x = _rnd(0, ARENA_W);
    const y = -20;
    const size = _rnd(12, 26);
    const speed = _rnd(2.5, 5) * (1 + difficulty * 0.1);

    const el = document.createElement("div");
    el.className = "dp-projectile";
    el.style.cssText = `
      position:absolute;
      width:${size}px; height:${size}px;
      left:${x}px; top:${y}px;
      transform:translate(-50%,-50%) rotate(45deg);
      background: ${cfg.color};
      box-shadow: 0 0 10px ${cfg.color}, 0 0 20px ${cfg.accent};
      clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
      pointer-events:none;
    `;
    _arena.appendChild(el);
    _objects.push({ el, x, y, vy: speed, size, type: "iceshard", isFreezer: size > 18 });
  }

  _addInterval(spawnIceShard, spawnRate);
  spawnIceShard();

  return function update() {
    // Gel progressif
    if (_freezeTimer > 0) {
      _freezeTimer -= 0.016;
      if (_freezeTimer < 0) _freezeTimer = 0;
      // Friction réduite par le gel
      _friction = 0.08 + (0.17 * (1 - _freezeTimer / _freezeMax));
    } else {
      _friction = 0.25;
    }

    for (let i = _objects.length - 1; i >= 0; i--) {
      const o = _objects[i];
      if (o.type !== "iceshard") continue;
      o.y += o.vy;
      o.el.style.top  = `${o.y}px`;
      o.el.style.left = `${o.x}px`;

      if (_hitCircle(_playerX, _playerY, PLAYER_RADIUS, o.x, o.y, o.size / 2)) {
        if (o.isFreezer) {
          // Gel partiel — ralentit mais ne tue pas (sauf si déjà gelé max)
          if (_freezeTimer >= _freezeMax * 0.8) return true;
          _freezeTimer = Math.min(_freezeMax, _freezeTimer + 1.5);
          _freezeMax = Math.max(_freezeMax, _freezeTimer);
          _arenaFlash(cfg.color, 200);
          _burstParticles(o.x, o.y, 10, cfg.color, cfg.accent);
          o.el.remove(); _objects.splice(i, 1);
        } else {
          return true;
        }
        continue;
      }
      if (o.y > ARENA_H + 20) { o.el.remove(); _objects.splice(i, 1); }
    }
    return false;
  };
}

// ─── 🌍 SOL : ondes de choc circulaires depuis le bas
function _mechanic_ground_shockwaves(cfg, difficulty) {
  function spawnShockwave() {
    if (_isOver) return;
    _screenShake(10, 400);
    _arenaFlash(cfg.color, 150);

    const cx = _rnd(50, ARENA_W - 50);
    const cy = ARENA_H; // depuis le bas

    for (let ring = 0; ring < 3; ring++) {
      _addTimeout(() => {
        if (_isOver) return;
        const el = document.createElement("div");
        el.className = "dp-ring dp-projectile";
        el.style.cssText = `
          position:absolute;
          width:10px; height:10px;
          border-radius:50%;
          border: 3px solid ${ring === 0 ? "#fde68a" : cfg.color};
          box-shadow: 0 0 10px ${cfg.color};
          left:${cx}px; top:${cy}px;
          transform:translate(-50%,-50%);
          pointer-events:none;
        `;
        _arena.appendChild(el);

        // Poussière au sol
        _burstParticles(cx, cy, 12, cfg.color, cfg.accent);

        const speed = (3 + difficulty * 0.4) * (1 + ring * 0.3);
        const obj = { el, cx, cy, r: 5, speed, type: "shockwave" };
        _objects.push(obj);
      }, ring * 150);
    }
  }

  _addInterval(spawnShockwave, Math.max(1000, 2500 - difficulty * 150));
  _addTimeout(spawnShockwave, 200);

  return function update() {
    for (let i = _objects.length - 1; i >= 0; i--) {
      const o = _objects[i];
      if (o.type !== "shockwave") continue;
      o.r += o.speed;
      const d = o.r * 2;
      o.el.style.width  = `${d}px`;
      o.el.style.height = `${d}px`;

      const dist = Math.hypot(_playerX - o.cx, _playerY - o.cy);
      const thickness = 10;
      if (Math.abs(dist - o.r) < PLAYER_RADIUS + thickness) return true;

      if (o.r > Math.hypot(ARENA_W, ARENA_H) * 0.8) {
        o.el.remove(); _objects.splice(i, 1);
      }
    }
    return false;
  };
}

// ─── 🪨 ROCHE : météorites massives avec ombre au sol
function _mechanic_rock_boulders(cfg, difficulty) {
  const spawnRate = Math.max(700, 1800 - difficulty * 150);

  function spawnBoulder() {
    if (_isOver) return;
    const size = _rnd(40, 80) * (1 + difficulty * 0.08);
    const x = _rnd(size, ARENA_W - size);
    const speed = _rnd(2, 4) * (1 + difficulty * 0.15);

    const el = document.createElement("div");
    el.className = "dp-projectile";
    el.style.cssText = `
      position:absolute;
      width:${size}px; height:${size}px;
      left:${x}px; top:-${size}px;
      transform:translate(-50%,-50%);
      background: radial-gradient(circle at 35% 35%, ${cfg.accent}, ${cfg.color} 60%, #292524);
      border-radius: ${40 + Math.random() * 20}% ${30 + Math.random() * 30}% ${40 + Math.random() * 20}% ${35 + Math.random() * 25}%;
      box-shadow: 4px 4px 12px rgba(0,0,0,0.6), 0 0 8px ${cfg.color}88;
      pointer-events:none;
    `;
    _arena.appendChild(el);

    // Ombre au sol (cible de tombée)
    const shadow = document.createElement("div");
    shadow.style.cssText = `
      position:absolute;
      width:${size * 0.7}px; height:${size * 0.3}px;
      left:${x}px; top:${ARENA_H - 20}px;
      transform:translate(-50%,-50%);
      background: radial-gradient(ellipse, rgba(0,0,0,0.5), transparent);
      border-radius:50%; pointer-events:none;
    `;
    _arena.appendChild(shadow);

    _objects.push({ el, shadow, x, y: -size, vy: speed, size, type: "boulder" });
  }

  _addInterval(spawnBoulder, spawnRate);
  spawnBoulder();

  return function update() {
    for (let i = _objects.length - 1; i >= 0; i--) {
      const o = _objects[i];
      if (o.type !== "boulder") continue;
      o.vy += 0.1; // gravité
      o.y  += o.vy;
      o.el.style.top = `${o.y}px`;

      // La taille de l'ombre diminue à l'approche
      const shadowScale = Math.min(1, o.y / (ARENA_H - o.size));
      o.shadow.style.opacity = shadowScale;

      // Particules de débris dans la chute
      if (Math.random() < 0.15) {
        _spawnParticle(o.x + _rnd(-o.size / 3, o.size / 3), o.y - o.size / 3, {
          color: cfg.color, size: _rnd(3, 8),
          vx: _rnd(-2, 2), vy: _rnd(-2, 1), life: 350
        });
      }

      if (_hitCircle(_playerX, _playerY, PLAYER_RADIUS, o.x, o.y, o.size * 0.45)) {
        _screenShake(15, 400);
        _burstParticles(o.x, o.y, 20, cfg.color, cfg.accent);
        return true;
      }

      if (o.y > ARENA_H + o.size) {
        // Impact au sol
        _screenShake(8, 300);
        _burstParticles(o.x, ARENA_H, 15, cfg.color, cfg.accent);
        _arenaFlash(cfg.color, 100);
        o.el.remove();
        o.shadow.remove();
        _objects.splice(i, 1);
      }
    }
    return false;
  };
}

// ─── 💨 VOL : rafales de vent qui dévient la pokéball
function _mechanic_flying_gusts(cfg, difficulty) {
  let gustX = 0, gustY = 0;
  _friction = 0.12; // contrôle glissant

  function triggerGust() {
    if (_isOver) return;
    const angle  = Math.random() * Math.PI * 2;
    const force  = (3 + difficulty * 0.5);
    gustX = Math.cos(angle) * force;
    gustY = Math.sin(angle) * force;
    _windX = gustX;
    _windY = gustY;

    // Affiche des lignes de vent dans la direction
    for (let i = 0; i < 12; i++) {
      const el = document.createElement("div");
      el.className = "dp-gust";
      const px = _rnd(0, ARENA_W);
      const py = _rnd(0, ARENA_H);
      const len = _rnd(30, 80);
      el.style.cssText = `
        position:absolute;
        width:${len}px; height:2px;
        left:${px}px; top:${py}px;
        background: linear-gradient(90deg, transparent, ${cfg.color}, transparent);
        transform:rotate(${Math.atan2(gustY, gustX) * 180 / Math.PI}deg);
        transform-origin:left center;
        opacity:0.7; pointer-events:none;
        border-radius:2px;
      `;
      _arena.appendChild(el);
      _addTimeout(() => el.remove(), _rnd(300, 600));
    }

    // Progressivement le vent s'estompe
    let fade = 0;
    const fadeInterval = setInterval(() => {
      fade++;
      _windX *= 0.9;
      _windY *= 0.9;
      if (fade > 30) clearInterval(fadeInterval);
    }, 50);
    _intervals.push(fadeInterval);

    // Projectiles en rafale
    for (let i = 0; i < 5; i++) {
      _addTimeout(() => {
        if (_isOver) return;
        const spawnAngle = angle + _rnd(-0.4, 0.4);
        const sx = angle > 0 && angle < Math.PI ? _rnd(0, ARENA_W) : (gustX > 0 ? -20 : ARENA_W + 20);
        const sy = gustY > 0 ? -20 : ARENA_H + 20;
        const el2 = document.createElement("div");
        el2.className = "dp-projectile";
        el2.style.cssText = `
          position:absolute;
          width:${_rnd(8, 16)}px; height:${_rnd(20, 40)}px;
          left:${sx}px; top:${sy}px;
          background:linear-gradient(180deg,${cfg.accent},${cfg.color});
          border-radius:50%;
          transform:translate(-50%,-50%) rotate(${spawnAngle * 180 / Math.PI + 90}deg);
          box-shadow:0 0 8px ${cfg.color};
          pointer-events:none;
          opacity:0.8;
        `;
        _arena.appendChild(el2);
        const speed = (5 + difficulty * 0.5);
        _objects.push({
          el: el2,
          x: sx, y: sy,
          vx: Math.cos(spawnAngle) * speed,
          vy: Math.sin(spawnAngle) * speed,
          w: 14, h: 14,
          type: "gust_projectile"
        });
      }, i * 100);
    }
  }

  _addInterval(triggerGust, Math.max(800, 2000 - difficulty * 150));
  _addTimeout(triggerGust, 300);

  return function update() {
    // Appliquer le vent sur le joueur
    _playerX += _windX * 0.4;
    _playerY += _windY * 0.4;

    for (let i = _objects.length - 1; i >= 0; i--) {
      const o = _objects[i];
      if (o.type !== "gust_projectile") continue;
      o.x += o.vx; o.y += o.vy;
      o.el.style.left = `${o.x}px`;
      o.el.style.top  = `${o.y}px`;

      if (_hitCircle(_playerX, _playerY, PLAYER_RADIUS, o.x, o.y, 10)) return true;
      if (o.x < -50 || o.x > ARENA_W + 50 || o.y < -50 || o.y > ARENA_H + 50) {
        o.el.remove(); _objects.splice(i, 1);
      }
    }
    return false;
  };
}

// ─── 🧠 PSY : contrôles inversés + zones d'illusion fantômes
function _mechanic_psychic_distort(cfg, difficulty) {
  let invertTimer = 0;
  _invertControls = false;

  function triggerInvert() {
    if (_isOver) return;
    _invertControls = true;
    invertTimer = 3 + difficulty * 0.3;
    _arenaFlash(cfg.color, 300);
    _screenShake(6, 400);

    // Effet visuel : swirl de particules
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      _spawnParticle(
        ARENA_W / 2 + Math.cos(angle) * 100,
        ARENA_H / 2 + Math.sin(angle) * 80,
        { color: cfg.color, size: _rnd(4, 10), vx: Math.cos(angle + 1.5) * 3, vy: Math.sin(angle + 1.5) * 3, life: 600 }
      );
    }
  }

  // Faux projectiles (mirages) qui ne font pas de dégâts
  function spawnMirage() {
    if (_isOver) return;
    const x = _rnd(0, ARENA_W);
    const el = document.createElement("div");
    el.className = "dp-projectile";
    el.style.cssText = `
      position:absolute;
      width:20px; height:20px;
      left:${x}px; top:-20px;
      border-radius:50%;
      background: ${cfg.color}66;
      box-shadow: 0 0 10px ${cfg.color};
      pointer-events:none;
    `;
    _arena.appendChild(el);
    _objects.push({ el, x, y: -20, vy: 3 + difficulty * 0.3, isMirage: Math.random() < 0.4, type: "psy_proj" });
  }

  _addInterval(triggerInvert, Math.max(2000, 4000 - difficulty * 200));
  _addInterval(spawnMirage,  Math.max(400, 900 - difficulty * 60));
  _addTimeout(spawnMirage, 100);

  return function update(now) {
    if (invertTimer > 0) {
      invertTimer -= 0.016;
      _invertControls = invertTimer > 0;
      if (!_invertControls) _arenaFlash(cfg.accent, 200);
    }

    for (let i = _objects.length - 1; i >= 0; i--) {
      const o = _objects[i];
      if (o.type !== "psy_proj") continue;
      // Les mirages oscillent latéralement
      o.y += o.vy;
      o.x += Math.sin(o.y * 0.05) * 2;
      o.el.style.top  = `${o.y}px`;
      o.el.style.left = `${o.x}px`;

      if (!o.isMirage && _hitCircle(_playerX, _playerY, PLAYER_RADIUS, o.x, o.y, 10)) return true;
      if (o.y > ARENA_H + 20) { o.el.remove(); _objects.splice(i, 1); }
    }
    return false;
  };
}

// ─── 🐛 INSECTE : essaim en V qui traque le joueur
function _mechanic_bug_swarm(cfg, difficulty) {
  const SWARM_COUNT = 18 + difficulty * 2;
  const bees = [];

  // Créer l'essaim en formation V
  for (let i = 0; i < SWARM_COUNT; i++) {
    const el = document.createElement("div");
    el.className = "dp-swarm dp-projectile";
    const row = Math.floor(i / 5);
    const col = i % 5;
    const sx = -100 - row * 20;
    const sy = ARENA_H / 2 - 60 + col * 30;
    el.style.cssText = `
      position:absolute;
      width:10px; height:8px;
      left:${sx}px; top:${sy}px;
      border-radius:50%;
      background:${cfg.color};
      box-shadow:0 0 6px ${cfg.color};
      pointer-events:none;
    `;
    _arena.appendChild(el);
    bees.push({ el, x: sx, y: sy, offsetX: (col - 2) * 25, offsetY: row * 20, vx: 0, vy: 0 });
  }

  let leaderX = -80, leaderY = ARENA_H / 2;
  const speed = 2.5 + difficulty * 0.3;

  return function update() {
    // Leader traque le joueur avec délai
    leaderX += (_playerX - leaderX) * (0.02 + difficulty * 0.003);
    leaderY += (_playerY - leaderY) * (0.02 + difficulty * 0.003);

    for (let i = 0; i < bees.length; i++) {
      const b = bees[i];
      // Formation : chaque abeille suit le leader avec son offset + oscillation
      const targetX = leaderX + b.offsetX + Math.sin(Date.now() * 0.003 + i) * 6;
      const targetY = leaderY + b.offsetY + Math.cos(Date.now() * 0.002 + i) * 6;
      b.x += (targetX - b.x) * 0.1;
      b.y += (targetY - b.y) * 0.1;
      b.el.style.left = `${b.x}px`;
      b.el.style.top  = `${b.y}px`;

      if (_hitCircle(_playerX, _playerY, PLAYER_RADIUS, b.x, b.y, 8)) return true;
    }

    // Particules de vol
    if (Math.random() < 0.3) {
      const rb = bees[_rndInt(0, bees.length - 1)];
      _spawnParticle(rb.x, rb.y, { color: cfg.accent, size: _rnd(2, 4), vx: _rnd(-1, 1), vy: _rnd(-1, 1), life: 200, glow: false });
    }
    return false;
  };
}

// ─── 👻 SPECTRE : obscurité + zones fantômes qui apparaissent
function _mechanic_ghost_dark(cfg, difficulty) {
  // Overlay d'obscurité
  const darkOverlay = document.createElement("div");
  darkOverlay.style.cssText = `
    position:absolute; inset:0;
    background: radial-gradient(circle at var(--ox,50%) var(--oy,50%), transparent 60px, rgba(15,10,30,0.92) 120px);
    pointer-events:none; z-index:5;
    transition: --ox 0.1s, --oy 0.1s;
  `;
  _arena.appendChild(darkOverlay);
  _objects.push({ el: darkOverlay, type: "overlay" });

  function spawnGhost() {
    if (_isOver) return;
    const x = _rnd(30, ARENA_W - 30);
    const y = _rnd(30, ARENA_H - 30);
    const size = _rnd(40, 80);
    const linger = _rnd(1500, 3000);

    const el = document.createElement("div");
    el.className = "dp-zone dp-projectile";
    el.style.cssText = `
      position:absolute;
      width:${size}px; height:${size}px;
      left:${x}px; top:${y}px;
      transform:translate(-50%,-50%);
      border-radius:50%;
      background: radial-gradient(circle, ${cfg.color}44, transparent 70%);
      border: 2px solid ${cfg.color}88;
      box-shadow: 0 0 20px ${cfg.color}66;
      pointer-events:none; z-index:6;
      animation: ghostPulse 0.8s ease-in-out infinite alternate;
    `;
    _arena.appendChild(el);

    const obj = { el, x, y, r: size / 2, type: "ghost_zone", alive: true };
    _objects.push(obj);

    _addTimeout(() => {
      if (!obj.alive) return;
      obj.alive = false;
      el.style.opacity = "0";
      el.style.transition = "opacity 0.4s";
      _addTimeout(() => {
        el.remove();
        const idx = _objects.indexOf(obj);
        if (idx > -1) _objects.splice(idx, 1);
      }, 400);
    }, linger);
  }

  _addInterval(spawnGhost, Math.max(600, 1500 - difficulty * 100));
  spawnGhost();

  return function update() {
    // Déplace le halo de visibilité autour du joueur
    const px = (_playerX / ARENA_W * 100).toFixed(1);
    const py = (_playerY / ARENA_H * 100).toFixed(1);
    darkOverlay.style.setProperty("--ox", `${px}%`);
    darkOverlay.style.setProperty("--oy", `${py}%`);

    for (const o of _objects) {
      if (o.type !== "ghost_zone" || !o.alive) continue;
      if (_hitCircle(_playerX, _playerY, PLAYER_RADIUS, o.x, o.y, o.r)) return true;
    }
    return false;
  };
}

// ─── 🐉 DRAGON : météores en spirale centrifuge
function _mechanic_dragon_spiral(cfg, difficulty) {
  let angle = 0;
  const orbitRadius  = 80 + difficulty * 10;
  const orbitSpeed   = 0.04 + difficulty * 0.004;
  const projectileSpeed = 4 + difficulty * 0.5;

  // Plusieurs bras de la spirale
  const ARMS = 3;

  function shootSpiral() {
    if (_isOver) return;
    for (let arm = 0; arm < ARMS; arm++) {
      const a = angle + (arm / ARMS) * Math.PI * 2;
      const sx = ARENA_W / 2 + Math.cos(a) * orbitRadius;
      const sy = ARENA_H / 2 + Math.sin(a) * orbitRadius;

      const el = document.createElement("div");
      el.className = "dp-projectile";
      const size = _rnd(12, 22);
      el.style.cssText = `
        position:absolute;
        width:${size}px; height:${size}px;
        left:${sx}px; top:${sy}px;
        transform:translate(-50%,-50%);
        border-radius:${Math.random() < 0.5 ? "50%" : "20%"};
        background: radial-gradient(circle, ${cfg.accent}, ${cfg.color});
        box-shadow: 0 0 15px ${cfg.color}, 0 0 25px ${cfg.accent};
        pointer-events:none;
      `;
      _arena.appendChild(el);

      // Direction : vers l'extérieur depuis le centre
      const vx = Math.cos(a) * projectileSpeed;
      const vy = Math.sin(a) * projectileSpeed;
      _objects.push({ el, x: sx, y: sy, vx, vy, size, type: "meteor" });

      // Traînée lumineuse
      _spawnParticle(sx, sy, {
        color: cfg.color, size: _rnd(4, 10),
        vx: -vx * 0.3, vy: -vy * 0.3, life: 300
      });
    }
    angle += orbitSpeed * 20;
  }

  _addInterval(shootSpiral, Math.max(120, 300 - difficulty * 20));

  return function update() {
    for (let i = _objects.length - 1; i >= 0; i--) {
      const o = _objects[i];
      if (o.type !== "meteor") continue;
      o.x += o.vx; o.y += o.vy;
      o.el.style.left = `${o.x}px`;
      o.el.style.top  = `${o.y}px`;

      // Traînée
      if (Math.random() < 0.4) {
        _spawnParticle(o.x, o.y, {
          color: cfg.color, size: _rnd(3, 7),
          vx: -o.vx * 0.2 + _rnd(-1, 1), vy: -o.vy * 0.2 + _rnd(-1, 1), life: 250
        });
      }

      if (_hitCircle(_playerX, _playerY, PLAYER_RADIUS, o.x, o.y, o.size / 2)) return true;
      if (o.x < -40 || o.x > ARENA_W + 40 || o.y < -40 || o.y > ARENA_H + 40) {
        o.el.remove(); _objects.splice(i, 1);
      }
    }
    return false;
  };
}

// ─── 🌑 TÉNÈBRES : mines à retardement (zones qui explosent)
function _mechanic_dark_mines(cfg, difficulty) {
  const DELAY = Math.max(1200, 2500 - difficulty * 150);
  const BLAST_DURATION = 400;

  function spawnMine() {
    if (_isOver) return;
    const x = _rnd(40, ARENA_W - 40);
    const y = _rnd(40, ARENA_H - 40);
    const size = _rnd(50, 90);

    const el = document.createElement("div");
    el.className = "dp-mine dp-zone";
    el.style.cssText = `
      position:absolute;
      width:${size}px; height:${size}px;
      left:${x}px; top:${y}px;
      transform:translate(-50%,-50%);
      border-radius:50%;
      border: 3px solid ${cfg.accent}66;
      background: radial-gradient(circle, ${cfg.accent}11, transparent 70%);
      pointer-events:none;
      animation: minePulse 0.4s linear infinite;
    `;
    _arena.appendChild(el);

    let charging = true;
    const obj = { el, x, y, r: size / 2, type: "mine", charging: true };
    _objects.push(obj);

    // Phase de charge : la mine grossit et devient plus visible
    let chargeProgress = 0;
    const chargeInterval = setInterval(() => {
      if (_isOver || !charging) { clearInterval(chargeInterval); return; }
      chargeProgress = Math.min(1, chargeProgress + (16 / DELAY));
      el.style.border = `3px solid ${cfg.accent}${Math.floor(chargeProgress * 255).toString(16).padStart(2, "0")}`;
      el.style.boxShadow = `0 0 ${chargeProgress * 30}px ${cfg.accent}`;
    }, 16);
    _intervals.push(chargeInterval);

    // Explosion
    _addTimeout(() => {
      if (_isOver) return;
      charging = false;
      clearInterval(chargeInterval);
      obj.charging = false;

      // Boom visuel
      el.style.width  = `${size * 2.5}px`;
      el.style.height = `${size * 2.5}px`;
      el.style.background = `radial-gradient(circle, ${cfg.accent}, ${cfg.color}, transparent 70%)`;
      el.style.border = "none";
      el.style.boxShadow = `0 0 60px ${cfg.accent}, 0 0 100px ${cfg.color}`;
      el.style.transition = `all ${BLAST_DURATION}ms ease-out`;
      obj.r = (size * 2.5) / 2;

      _arenaFlash(cfg.color, 200);
      _burstParticles(x, y, 20, cfg.color, cfg.accent);

      _addTimeout(() => {
        el.remove();
        const idx = _objects.indexOf(obj);
        if (idx > -1) _objects.splice(idx, 1);
      }, BLAST_DURATION);
    }, DELAY);
  }

  _addInterval(spawnMine, Math.max(600, 1500 - difficulty * 100));
  spawnMine();

  return function update() {
    for (const o of _objects) {
      if (o.type !== "mine") continue;
      if (_hitCircle(_playerX, _playerY, PLAYER_RADIUS, o.x, o.y, o.r)) return true;
    }
    return false;
  };
}

// ─── ⚙️ ACIER : murs latéraux qui se referment
function _mechanic_steel_walls(cfg, difficulty) {
  const CLOSE_SPEED = 0.6 + difficulty * 0.1;

  function spawnWallPair() {
    if (_isOver) return;
    const isHorizontal = Math.random() < 0.4;

    if (!isHorizontal) {
      // Murs gauche/droite
      const leftEl = document.createElement("div");
      const rightEl = document.createElement("div");
      const wallH = _rnd(80, 160);
      const wallY = _rnd(0, ARENA_H - wallH);
      const gap   = _rnd(100, 180);

      const baseStyle = `
        position:absolute; pointer-events:none;
        width:30px; height:${wallH}px;
        top:${wallY}px;
        background: linear-gradient(90deg, ${cfg.color}, ${cfg.accent});
        box-shadow: 0 0 15px ${cfg.color};
      `;
      leftEl.className  = "dp-wall dp-projectile";
      rightEl.className = "dp-wall dp-projectile";
      leftEl.style.cssText  = baseStyle + `left: 0px; border-radius: 0 6px 6px 0;`;
      rightEl.style.cssText = baseStyle + `left: ${ARENA_W - 30}px; border-radius: 6px 0 0 6px;`;

      _arena.appendChild(leftEl);
      _arena.appendChild(rightEl);

      let lx = 0, rx = ARENA_W - 30;
      const lw = 30, rw = 30;
      const target = (ARENA_W - gap) / 2;

      const wObj = {
        el: leftEl, el2: rightEl,
        lx, rx, wallY, wallH, lw, rw,
        target, speed: CLOSE_SPEED, isClosing: true,
        type: "wall_pair"
      };
      _objects.push(wObj);

      // Scintillement métallique
      for (let i = 0; i < 8; i++) {
        _addTimeout(() => {
          if (_isOver) return;
          _spawnParticle(lx + _rnd(0, 30), wallY + _rnd(0, wallH), {
            color: cfg.accent, size: _rnd(2, 5), vx: _rnd(0.5, 2), vy: 0, life: 300, shape: "star"
          });
          _spawnParticle(rx + _rnd(0, rw), wallY + _rnd(0, wallH), {
            color: cfg.accent, size: _rnd(2, 5), vx: _rnd(-2, -0.5), vy: 0, life: 300, shape: "star"
          });
        }, i * 80);
      }
    } else {
      // Murs haut/bas
      const wallW = _rnd(80, 180);
      const wallX = _rnd(0, ARENA_W - wallW);
      const gap   = _rnd(80, 150);
      const topEl = document.createElement("div");
      const botEl = document.createElement("div");

      const baseStyle = `position:absolute; pointer-events:none;
        width:${wallW}px; height:25px; left:${wallX}px;
        background: linear-gradient(180deg, ${cfg.color}, ${cfg.accent});
        box-shadow: 0 0 15px ${cfg.color};`;
      topEl.className = "dp-wall dp-projectile";
      botEl.className = "dp-wall dp-projectile";
      topEl.style.cssText = baseStyle + "top:0px; border-radius: 0 0 6px 6px;";
      botEl.style.cssText = baseStyle + `top:${ARENA_H - 25}px; border-radius: 6px 6px 0 0;`;

      _arena.appendChild(topEl);
      _arena.appendChild(botEl);

      _objects.push({
        el: topEl, el2: botEl,
        ty: 0, by: ARENA_H - 25,
        wallX, wallW, wallH: 25,
        gap, speed: CLOSE_SPEED, isHorizontal: true,
        type: "wall_pair_h"
      });
    }
  }

  _addInterval(spawnWallPair, Math.max(1500, 3000 - difficulty * 200));
  _addTimeout(spawnWallPair, 300);

  return function update() {
    for (let i = _objects.length - 1; i >= 0; i--) {
      const o = _objects[i];

      if (o.type === "wall_pair") {
        if (o.isClosing) {
          o.lx = Math.min(o.lx + o.speed, o.target);
          o.rx = Math.max(o.rx - o.speed, ARENA_W - o.target - o.rw);
          o.el.style.left  = `${o.lx}px`;
          o.el2.style.left = `${o.rx}px`;

          // Collision
          if (_hitRect(_playerX, _playerY, PLAYER_RADIUS, o.lx, o.wallY, o.lw, o.wallH)) return true;
          if (_hitRect(_playerX, _playerY, PLAYER_RADIUS, o.rx, o.wallY, o.rw, o.wallH)) return true;

          if (o.lx >= o.target) {
            o.isClosing = false;
            _screenShake(12, 300);
            _arenaFlash(cfg.color, 200);
            _addTimeout(() => {
              o.el.remove(); o.el2.remove();
              _objects.splice(_objects.indexOf(o), 1);
            }, 800);
          }
        }
      }

      if (o.type === "wall_pair_h") {
        o.ty = Math.min(o.ty + o.speed, (ARENA_H - o.gap) / 2 - o.wallH);
        o.by = Math.max(o.by - o.speed, (ARENA_H + o.gap) / 2);
        o.el.style.top  = `${o.ty}px`;
        o.el2.style.top = `${o.by}px`;

        if (_hitRect(_playerX, _playerY, PLAYER_RADIUS, o.wallX, o.ty, o.wallW, o.wallH)) return true;
        if (_hitRect(_playerX, _playerY, PLAYER_RADIUS, o.wallX, o.by, o.wallW, o.wallH)) return true;

        if (o.ty >= (ARENA_H - o.gap) / 2 - o.wallH) {
          _screenShake(10, 300);
          _addTimeout(() => {
            o.el.remove(); o.el2.remove();
            const idx = _objects.indexOf(o);
            if (idx > -1) _objects.splice(idx, 1);
          }, 800);
        }
      }
    }
    return false;
  };
}

// ─── 🧪 POISON : nuage toxique qui envahit progressivement
function _mechanic_poison_cloud(cfg, difficulty) {
  const clouds = [];
  let totalPoisoned = 0; // % de l'arène empoisonnée

  function spawnCloud() {
    if (_isOver) return;
    const x = _rnd(0, ARENA_W);
    const y = _rnd(0, ARENA_H);
    const finalSize = _rnd(80, 160);

    const el = document.createElement("div");
    el.className = "dp-cloud dp-zone";
    el.style.cssText = `
      position:absolute;
      width:10px; height:10px;
      left:${x}px; top:${y}px;
      transform:translate(-50%,-50%);
      border-radius:50%;
      background: radial-gradient(circle, ${cfg.color}66, ${cfg.accent}22, transparent 70%);
      pointer-events:none;
    `;
    _arena.appendChild(el);

    const obj = { el, x, y, r: 5, finalR: finalSize / 2, growSpeed: 0.4, type: "cloud" };
    _objects.push(obj);
    clouds.push(obj);

    // Particules de gaz
    const gasInterval = setInterval(() => {
      if (_isOver || obj.r >= obj.finalR) { clearInterval(gasInterval); return; }
      _spawnParticle(x + _rnd(-obj.r, obj.r), y + _rnd(-obj.r, obj.r), {
        color: cfg.color, size: _rnd(3, 8),
        vx: _rnd(-1, 1), vy: _rnd(-2, -0.5), life: 600, glow: true
      });
    }, 80);
    _intervals.push(gasInterval);
  }

  _addInterval(spawnCloud, Math.max(800, 2000 - difficulty * 150));
  spawnCloud();

  return function update() {
    for (const o of _objects) {
      if (o.type !== "cloud") continue;
      if (o.r < o.finalR) o.r += o.growSpeed;
      const d = o.r * 2;
      o.el.style.width  = `${d}px`;
      o.el.style.height = `${d}px`;

      if (_hitCircle(_playerX, _playerY, PLAYER_RADIUS, o.x, o.y, o.r * 0.7)) return true;
    }
    return false;
  };
}

// ─── 🥊 COMBAT : poings géants qui smashent des zones
function _mechanic_fighting_punches(cfg, difficulty) {
  const WARNING_DURATION = Math.max(500, 1000 - difficulty * 60);

  function spawnPunch() {
    if (_isOver) return;
    // Vise légèrement le joueur
    const targetX = _playerX + _rnd(-80, 80);
    const targetY = _playerY + _rnd(-60, 60);
    const size = _rnd(60, 100);

    // Zone d'alerte
    const warn = document.createElement("div");
    warn.className = "dp-zone";
    warn.style.cssText = `
      position:absolute;
      width:${size}px; height:${size}px;
      left:${targetX}px; top:${targetY}px;
      transform:translate(-50%,-50%);
      border-radius:30% 40% 35% 45%;
      border: 3px dashed ${cfg.color}aa;
      background: ${cfg.color}11;
      pointer-events:none;
      animation: warnPulse 0.15s linear infinite alternate;
    `;
    _arena.appendChild(warn);

    _addTimeout(() => {
      if (_isOver) { warn.remove(); return; }
      warn.remove();

      // Impact du poing
      const impact = document.createElement("div");
      impact.className = "dp-zone dp-projectile";
      impact.style.cssText = `
        position:absolute;
        width:${size}px; height:${size}px;
        left:${targetX}px; top:${targetY}px;
        transform:translate(-50%,-50%) scale(0);
        border-radius:30% 40% 35% 45%;
        background: radial-gradient(circle, ${cfg.accent}, ${cfg.color} 60%, transparent);
        box-shadow: 0 0 30px ${cfg.color};
        pointer-events:none;
        transition: transform 0.1s cubic-bezier(0.22, 1, 0.36, 1);
      `;
      _arena.appendChild(impact);

      _addTimeout(() => { impact.style.transform = "translate(-50%,-50%) scale(1)"; }, 10);

      _screenShake(12, 350);
      _arenaFlash(cfg.color, 120);
      _burstParticles(targetX, targetY, 18, cfg.color, cfg.accent);

      const obj = { el: impact, x: targetX, y: targetY, r: size / 2, type: "punch_zone" };
      _objects.push(obj);

      _addTimeout(() => {
        impact.style.transition = "opacity 0.3s";
        impact.style.opacity = "0";
        _addTimeout(() => {
          impact.remove();
          const idx = _objects.indexOf(obj);
          if (idx > -1) _objects.splice(idx, 1);
        }, 300);
      }, 300);
    }, WARNING_DURATION);
  }

  _addInterval(spawnPunch, Math.max(600, 1400 - difficulty * 100));
  _addTimeout(spawnPunch, 200);

  return function update() {
    for (const o of _objects) {
      if (o.type !== "punch_zone") continue;
      if (_hitCircle(_playerX, _playerY, PLAYER_RADIUS, o.x, o.y, o.r * 0.7)) return true;
    }
    return false;
  };
}

// ─── 🌟 FÉE : cercles enchantés qui explosent
function _mechanic_fairy_circles(cfg, difficulty) {
  const LINGER_MS = Math.max(1000, 2500 - difficulty * 150);

  function spawnCircle() {
    if (_isOver) return;
    const x = _rnd(50, ARENA_W - 50);
    const y = _rnd(50, ARENA_H - 50);
    const size = _rnd(50, 110);

    const el = document.createElement("div");
    el.className = "dp-ring dp-zone dp-projectile";
    el.style.cssText = `
      position:absolute;
      width:${size}px; height:${size}px;
      left:${x}px; top:${y}px;
      transform:translate(-50%,-50%);
      border-radius:50%;
      border: 3px solid ${cfg.color};
      box-shadow: 0 0 20px ${cfg.color}, inset 0 0 15px ${cfg.color}44;
      background: ${cfg.color}0a;
      pointer-events:none;
      animation: fairySpin 2s linear infinite;
    `;
    _arena.appendChild(el);

    // Pétales de fée
    for (let i = 0; i < 6; i++) {
      _addTimeout(() => {
        if (_isOver) return;
        const angle = Math.random() * Math.PI * 2;
        _spawnParticle(x + Math.cos(angle) * size / 2, y + Math.sin(angle) * size / 2, {
          color: Math.random() < 0.5 ? cfg.color : cfg.accent,
          size: _rnd(4, 9), vx: Math.cos(angle + 1.5) * 2, vy: Math.sin(angle + 1.5) * 2 - 1, life: 800
        });
      }, i * 150);
    }

    const obj = { el, x, y, r: size / 2, type: "fairy_circle", alive: true };
    _objects.push(obj);

    _addTimeout(() => {
      if (!obj.alive || _isOver) return;
      // Explosion féerique
      _burstParticles(x, y, 25, cfg.color, cfg.accent);
      _arenaFlash(cfg.color, 250);

      // Zone d'explosion
      const blastSize = size * 1.8;
      obj.r = blastSize / 2;
      el.style.width  = `${blastSize}px`;
      el.style.height = `${blastSize}px`;
      el.style.background = `radial-gradient(circle, ${cfg.accent}, ${cfg.color}88, transparent 70%)`;
      el.style.border = "none";
      el.style.transition = "all 0.3s ease-out";

      _addTimeout(() => {
        obj.alive = false;
        el.style.opacity = "0";
        _addTimeout(() => {
          el.remove();
          const idx = _objects.indexOf(obj);
          if (idx > -1) _objects.splice(idx, 1);
        }, 300);
      }, 300);
    }, LINGER_MS);
  }

  _addInterval(spawnCircle, Math.max(700, 1800 - difficulty * 120));
  spawnCircle();

  return function update() {
    for (const o of _objects) {
      if (o.type !== "fairy_circle" || !o.alive) continue;
      if (_hitCircle(_playerX, _playerY, PLAYER_RADIUS, o.x, o.y, o.r * 0.8)) return true;
    }
    return false;
  };
}

// ─── 🔘 NORMAL : projectiles classiques tombants (fallback)
function _mechanic_normal_drops(cfg, difficulty) {
  function spawnDrop() {
    if (_isOver) return;
    const x = _rnd(10, ARENA_W - 10);
    const size = _rnd(10, 22);
    const speed = _rnd(3, 6) * (1 + difficulty * 0.15);
    const el = document.createElement("div");
    el.className = "dp-projectile";
    el.style.cssText = `
      position:absolute;
      width:${size}px; height:${size}px;
      left:${x}px; top:-${size}px;
      border-radius:50%;
      background: radial-gradient(circle, ${cfg.accent}, ${cfg.color});
      box-shadow: 0 0 8px ${cfg.color};
      pointer-events:none;
    `;
    _arena.appendChild(el);
    _objects.push({ el, x, y: -size, vy: speed, size, type: "drop" });
  }

  _addInterval(spawnDrop, Math.max(300, 700 - difficulty * 60));
  spawnDrop();

  return function update() {
    for (let i = _objects.length - 1; i >= 0; i--) {
      const o = _objects[i];
      if (o.type !== "drop") continue;
      o.y += o.vy;
      o.el.style.top = `${o.y}px`;
      if (_hitCircle(_playerX, _playerY, PLAYER_RADIUS, o.x, o.y, o.size / 2)) return true;
      if (o.y > ARENA_H + 20) { o.el.remove(); _objects.splice(i, 1); }
    }
    return false;
  };
}

// Mapping mechanic ID → fonction
const MECHANICS = {
  fire_rings:        _mechanic_fire_rings,
  water_sweep:       _mechanic_water_sweep,
  electric_bolts:    _mechanic_electric_bolts,
  grass_vines:       _mechanic_grass_vines,
  ice_freeze:        _mechanic_ice_freeze,
  ground_shockwaves: _mechanic_ground_shockwaves,
  rock_boulders:     _mechanic_rock_boulders,
  flying_gusts:      _mechanic_flying_gusts,
  psychic_distort:   _mechanic_psychic_distort,
  bug_swarm:         _mechanic_bug_swarm,
  ghost_dark:        _mechanic_ghost_dark,
  dragon_spiral:     _mechanic_dragon_spiral,
  dark_mines:        _mechanic_dark_mines,
  steel_walls:       _mechanic_steel_walls,
  poison_cloud:      _mechanic_poison_cloud,
  fighting_punches:  _mechanic_fighting_punches,
  fairy_circles:     _mechanic_fairy_circles,
  normal_drops:      _mechanic_normal_drops
};

// ============================================================
//   POINT D'ENTRÉE PRINCIPAL
// ============================================================

/**
 * Lance le mini-jeu de défense.
 *
 * @param {string} pokemonType  — clé dans ATTACK_CONFIGS (ex: "fire")
 * @param {number} difficulty   — 0 à 5 (commun=0, légendaire=4)
 * @returns {Promise<boolean>}  — true = survie, false = touché
 */
export async function startDodgeMinigame(pokemonType, difficulty = 1) {
  const cfg = ATTACK_CONFIGS[pokemonType] || ATTACK_CONFIGS["normal"];

  // Récupération des éléments DOM
  const stage    = document.getElementById("defense-stage");
  const arena    = document.getElementById("defense-arena");
  const timerEl  = document.getElementById("defense-timer");
  const warnEl   = document.getElementById("defense-warning");

  _arena  = arena;
  _player = document.getElementById("player-avatar");

  // ── Affichage de l'UI ──
  stage.classList.remove("hidden");
  stage.className = stage.className.replace(/theme-\S+/g, "").trim();

  // Appliquer le thème de type
  arena.className = "";
  arena.classList.add(cfg.theme);

  // Nom de l'attaque en grand
  _showAttackName(cfg.attackName, cfg.color);
  warnEl.textContent = cfg.description + " / difficulé: " + difficulty;
  warnEl.style.color = cfg.color;

  // Mettre à jour le style CSS de l'avatar (Pokéball)
  _player.style.opacity         = "1";

  // Position initiale
  _playerX = ARENA_W / 2;
  _playerY = ARENA_H / 2;
  _mouseX  = ARENA_W / 2;
  _mouseY  = ARENA_H / 2;
  _player.style.left = `${_playerX}px`;
  _player.style.top  = `${_playerY}px`;

  // Suivi souris dans l'arène
  const onMouseMove = (e) => {
    const rect = arena.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    // Inversion PSY
    if (_invertControls) {
      _mouseX = ARENA_W - rawX;
      _mouseY = ARENA_H - rawY;
    } else {
      _mouseX = rawX;
      _mouseY = rawY;
    }
  };
  arena.addEventListener("mousemove", onMouseMove);

  // ── Splash intro ──
  await showSplashText("Attaque " + cfg.attackName + " !", 1000);

  return new Promise(async (resolve) => {
    _resolve = resolve;
    _isOver  = false;
    _friction = 0.25;
    _windX = 0; _windY = 0;
    _freezeTimer = 0; _freezeMax = 3;
    _invertControls = false;

    // Choisir la mécanique
    const mechanicFactory = MECHANICS[cfg.mechanic] || MECHANICS["normal_drops"];
    const updateFn = mechanicFactory(cfg, difficulty);

    // Durée totale
    const totalMs = cfg.duration * (1 + difficulty * 0.18);
    const startTime = performance.now();

    // Intervalle du timer
    const timerInterval = _addInterval(() => {
      if (_isOver) return;
      const elapsed  = performance.now() - startTime;
      const remaining = Math.max(0, totalMs - elapsed);
      timerEl.textContent = (remaining / 1000).toFixed(1) + "s";
      _updateSurvivalBar(elapsed, totalMs);
    }, 100);

    // ── Boucle principale ──
    function gameLoop(now) {
      if (_isOver) return;

      // Avancer la position joueur (élastique)
      _playerX += (_mouseX - _playerX) * _friction;
      _playerY += (_mouseY - _playerY) * _friction;

      // Vents
      _playerX += _windX;
      _playerY += _windY;

      // Clamp dans l'arène
      _playerX = Math.max(PLAYER_RADIUS, Math.min(ARENA_W - PLAYER_RADIUS, _playerX));
      _playerY = Math.max(PLAYER_RADIUS, Math.min(ARENA_H - PLAYER_RADIUS, _playerY));

      _renderPlayer();
      _updateParticles(now);

      // Mise à jour de la mécanique → renvoie true si mort
      const hit = updateFn(now);
      if (hit) { _triggerDefeat(arena, stage, onMouseMove, resolve); return; }

      // Victoire par temps écoulé
      if (performance.now() - startTime >= totalMs) {
        _triggerVictory(arena, stage, onMouseMove, resolve);
        return;
      }

      _raf = requestAnimationFrame(gameLoop);
    }

    _raf = requestAnimationFrame(gameLoop);
  });
}

// ─── VICTOIRE / DÉFAITE ───────────────────────────────────────
function _triggerDefeat(arena, stage, onMouseMove, resolve) {
  if (_isOver) return;
  _isOver = true;

  // Explosion de la pokéball
  _burstParticles(_playerX, _playerY, 30, "#ef4444", "#fff");
  _screenShake(20, 500);
  _arenaFlash("#ef4444", 400);

  arena.style.boxShadow = "inset 0 0 120px #ef4444";
  if (_player) _player.style.opacity = "0";

  cancelAnimationFrame(_raf);
  _intervals.forEach(clearInterval);
  _timeouts.forEach(clearTimeout);
  arena.removeEventListener("mousemove", onMouseMove);

  setTimeout(() => {
    _finalize(stage);
    resolve(false);
  }, 1200);
}

function _triggerVictory(arena, stage, onMouseMove, resolve) {
  if (_isOver) return;
  _isOver = true;

  // Feu d'artifice de la victoire
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      _burstParticles(
        _rnd(80, ARENA_W - 80),
        _rnd(60, ARENA_H - 60),
        20,
        `hsl(${_rndInt(0, 360)},100%,60%)`,
        "#fff"
      );
    }, i * 150);
  }

  arena.style.boxShadow = "inset 0 0 120px #22c55e";

  cancelAnimationFrame(_raf);
  _intervals.forEach(clearInterval);
  _timeouts.forEach(clearTimeout);
  arena.removeEventListener("mousemove", onMouseMove);

  setTimeout(() => {
    _finalize(stage);
    resolve(true);
  }, 1200);
}

function _finalize(stage) {
  _cleanup();
  stage.classList.add("hidden");
  const stageEl = document.getElementById("defense-stage");
  if (stageEl) stageEl.style.transform = "";
}