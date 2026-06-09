import { showSplashText } from "../battle-annimation.js";
import { _rnd, _rndInt } from "./utils.js";
import { ATTACK_CONFIGS } from "./attack_configs.js";

import { _mechanic_Hydrocanon } from "./mechanics/_mechanic_hydrocanon.js";
import { _mechanic_Deflagration } from "./mechanics/_mechanic_Deflagration.js";
import { _mechanic_Fatal_Foudre } from "./mechanics/_mechanic_Fatal_Foudre.js";
import { _mechanic_Tranch_Herbe } from "./mechanics/_mechanic_Tranch_Herbe.js";
import { _mechanic_Blizzard } from "./mechanics/_mechanic_Blizzard.js";
import { _mechanic_Seisme } from "./mechanics/_mechanic_Seisme.js";
import { _mechanic_Eboulement } from "./mechanics/_mechanic_Eboulement.js";
import { _mechanic_Aeropique } from "./mechanics/_mechanic_Aeropique.js";
import { _mechanic_Psyko } from "./mechanics/_mechanic_Psyko.js";
import { _mechanic_Dard_Nuee } from "./mechanics/_mechanic_Dard_Nuee.js";
import { _mechanic_Ombre_Portee } from "./mechanics/_mechanic_Ombre_Portee.js";
import { _mechanic_Draco_Meteor } from "./mechanics/_mechanic_Draco_Meteor.js";
import { _mechanic_Vibrobscur } from "./mechanics/_mechanic_Vibrobscur.js";
import { _mechanic_Mur_de_Fer } from "./mechanics/_mechanic_Mur_de_Fer.js";
import { _mechanic_Toxic } from "./mechanics/_mechanic_Toxic.js";
import { _mechanic_Close_Combat } from "./mechanics/_mechanic_Close_Combat.js";
import { _mechanic_Pouvoir_Lunaire } from "./mechanics/_mechanic_Pouvoir_Lunaire.js";
import { _mechanic_Ultralaser } from "./mechanics/_mechanic_Ultralaser.js";

// ─── CONSTANTES GLOBALES ─────────────────────────────────────
const ARENA_W = 600;
const ARENA_H = 400;
const PLAYER_RADIUS = 16; // rayon de collision de la Pokéball

export function _addInterval(fn, ms) {
  const id = setInterval(fn, ms);
  state._intervals.push(id);
  return id;
}
export function _addTimeout(fn, ms) {
  const id = setTimeout(fn, ms);
  state._timeouts.push(id);
  return id;
}

// ─── PARTICULES : POOL & SPAWN ────────────────────────────────
export function _spawnParticle(x, y, { color = "#fff", size = 6, vx = 0, vy = 0, life = 600, shape = "circle", glow = true } = {}) {
  const arena    = document.getElementById("defense-arena");
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
  state._arena.appendChild(el);

  const start = performance.now();
  const particle = { el, x, y, vx, vy, life, start };
  state._particlePool.push(particle);
}

export function _burstParticles(x, y, count, color, accent) {
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


// ─── ÉTAT GLOBAL DU MOTEUR ───────────────────────────────────
let state = {
  ARENA_W : ARENA_W,
  ARENA_H : ARENA_H,
  PLAYER_RADIUS : PLAYER_RADIUS,
  _raf : null,
  _intervals : [],
  _timeouts : [],
  _objects : [],
  _isOver : false,
  _arena : null,
  _player : null,
  _playerX : ARENA_W / 2,
  _playerY : ARENA_H / 2,
  _mouseX  : ARENA_W / 2,
  _mouseY  : ARENA_H / 2,
  _friction : 0.25,
  _windX : 0,
  _windY : 0,
  _invertControls : false,
  _freezeTimer : 0,      // secondes restantes de gel
  _freezeMax   : 0,
  _resolve : null,
  _particlePool : [],    // pool de particules réutilisables
}

function _updateParticles(now) {
  for (let i = state._particlePool.length - 1; i >= 0; i--) {
    const p = state._particlePool[i];
    const elapsed = now - p.start;
    const progress = elapsed / p.life;
    if (progress >= 1) {
      p.el.remove();
      state._particlePool.splice(i, 1);
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
  state._player.style.left  = `${state._playerX}px`;
  state._player.style.top   = `${state._playerY}px`;

  // Rotation au mouvement
  const dx = state._mouseX - state._playerX;
  const rot = dx * 0.5;
  state._player.style.transform = `translate(-50%, -50%) rotate(${rot}deg)`;

  // Gel visuel
  if (state._freezeTimer > 0) {
    const pct = state._freezeTimer / state._freezeMax;
    state._player.style.filter = `saturate(${1 - pct * 0.8}) brightness(${1 - pct * 0.4}) hue-rotate(${pct * 180}deg)`;
    state._player.style.boxShadow = `0 0 ${pct * 30}px #a5f3fc, 0 0 ${pct * 50}px #e0f2fe`;
  } else {
    state._player.style.filter = "";
    state._player.style.boxShadow = "0 0 12px rgba(255,255,255,0.4)";
  }
}

// ─── SCREEN-SHAKE ─────────────────────────────────────────────
export function _screenShake(intensity = 8, duration = 300) {
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
export function _arenaFlash(color, duration = 150) {
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
  cancelAnimationFrame(state._raf);
  state._intervals.forEach(clearInterval);
  state._timeouts.forEach(clearTimeout);
  state._intervals = [];
  state._timeouts  = [];
  state._objects.forEach(o => o.el && o.el.remove && o.el.remove());
  state._objects = [];
  state._particlePool.forEach(p => p.el && p.el.remove());
  state._particlePool = [];
  // supprimer tous les éléments de jeu injectés dans l'arène
  if (state._arena) {
    state._arena.querySelectorAll(".dp-particle,.dp-projectile,.dp-zone,.dp-vine,.dp-ring,.dp-gust,.dp-mine,.dp-swarm,.dp-wall,.dp-cloud").forEach(e => e.remove());
    state._arena.style = "";
  }
  if (state._player) {
    state._player.style.filter = "";
    state._player.style.boxShadow = "";
    state._player.style.transform = "translate(-50%,-50%)";
  }
  state._windX = 0;
  state._windY = 0;
  state._invertControls = false;
  state._freezeTimer = 0;
  state._isOver = false;
  state._arena = null;
  state._player = null;
}

// ─── DÉTECTION DE COLLISION (cercle / rect) ───────────────────
export function _hitCircle(ax, ay, ar, bx, by, br) {
  return Math.hypot(ax - bx, ay - by) < ar + br;
}
export function _hitRect(px, py, pr, rx, ry, rw, rh) {
  const cx = Math.max(rx, Math.min(px, rx + rw));
  const cy = Math.max(ry, Math.min(py, ry + rh));
  return Math.hypot(px - cx, py - cy) < pr;
}

// Mapping mechanic ID → fonction
const MECHANICS = {
  fire_rings:        _mechanic_Deflagration,
  water_sweep:       _mechanic_Hydrocanon,
  electric_bolts:    _mechanic_Fatal-Foudre,
  grass_vines:       _mechanic_Tranch_Herbe,
  ice_freeze:        _mechanic_Blizzard,
  ground_shockwaves: _mechanic_Seisme,
  rock_boulders:     _mechanic_Eboulement,
  flying_gusts:      _mechanic_Aeropique,
  psychic_distort:   _mechanic_Psyko,
  bug_swarm:         _mechanic_Dard_Nuee,
  ghost_dark:        _mechanic_Ombre_Portee,
  dragon_spiral:     _mechanic_Draco-Meteor,
  dark_mines:        _mechanic_Vibrobscur,
  steel_walls:       _mechanic_Mur_de_Fer,
  poison_cloud:      _mechanic_Toxic,
  fighting_punches:  _mechanic_Close_Combat,
  fairy_circles:     _mechanic_Pouvoir_Lunaire,
  normal_drops:      _mechanic_Ultralaser
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

  state._arena  = arena;
  state._player = document.getElementById("player-avatar");

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
  state._player.style.opacity         = "1";

  // Position initiale
  state._playerX = state.ARENA_W / 2;
  state._playerY = state.ARENA_H / 2;
  state._mouseX  = state.ARENA_W / 2;
  state._mouseY  = state.ARENA_H / 2;
  state._player.style.left = `${state._playerX}px`;
  state._player.style.top  = `${state._playerY}px`;

  // Suivi souris dans l'arène
 const onMouseMove = (e) => {
    const rect = arena.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;

    // Clamp optionnel pour que le joueur reste dans l'arène
    const clampedX = Math.max(0, Math.min(state.ARENA_W, rawX));
    const clampedY = Math.max(0, Math.min(state.ARENA_H, rawY));

    if (state._invertControls) {
        state._mouseX = state.ARENA_W - clampedX;
        state._mouseY = state.ARENA_H - clampedY;
    } else {
        state._mouseX = clampedX;
        state._mouseY = clampedY;
    }
};

document.addEventListener("mousemove", onMouseMove);

  // ── Splash intro ──
  await showSplashText("Attaque " + cfg.attackName + " !", 1000);

  return new Promise(async (resolve) => {
    state._resolve = resolve;
    state._isOver  = false;
    state._friction = 0.25;
    state._windX = 0; state._windY = 0;
    state._freezeTimer = 0; state._freezeMax = 3;
    state._invertControls = false;

    // Choisir la mécanique
    const mechanicFactory = MECHANICS[cfg.mechanic] || MECHANICS["normal_drops"];
    const updateFn = mechanicFactory(cfg, difficulty, state);

    // Durée totale
    const totalMs = cfg.duration * (1 + difficulty * 0.18);
    const startTime = performance.now();

    // Intervalle du timer
    const timerInterval = _addInterval(() => {
      if (state._isOver) return;
      const elapsed  = performance.now() - startTime;
      const remaining = Math.max(0, totalMs - elapsed);
      timerEl.textContent = (remaining / 1000).toFixed(1) + "s";
      _updateSurvivalBar(elapsed, totalMs);
    }, 100);

    // ── Boucle principale ──
    function gameLoop(now) {
      if (state._isOver) return;

      // Avancer la position joueur (élastique)
      state._playerX += (state._mouseX - state._playerX) * state._friction;
      state._playerY += (state._mouseY - state._playerY) * state._friction;

      // Vents
      state._playerX += state._windX;
      state._playerY += state._windY;

      // Clamp dans l'arène
      state._playerX = Math.max(state.PLAYER_RADIUS, Math.min(state.ARENA_W - state.PLAYER_RADIUS, state._playerX));
      state._playerY = Math.max(state.PLAYER_RADIUS, Math.min(state.ARENA_H - state.PLAYER_RADIUS, state._playerY));

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

      state._raf = requestAnimationFrame(gameLoop);
    }

    state._raf = requestAnimationFrame(gameLoop);
  });
}

// ─── VICTOIRE / DÉFAITE ───────────────────────────────────────
function _triggerDefeat(arena, stage, onMouseMove, resolve) {
  if (state._isOver) return;
  state._isOver = true;

  // Explosion de la pokéball
  _burstParticles(state._playerX, state._playerY, 30, "#ef4444", "#fff");
  _screenShake(20, 500);
  _arenaFlash("#ef4444", 400);

  arena.style.boxShadow = "inset 0 0 120px #ef4444";
  if (state._player) state._player.style.opacity = "0";

  cancelAnimationFrame(state._raf);
  state._intervals.forEach(clearInterval);
  state._timeouts.forEach(clearTimeout);
  arena.removeEventListener("mousemove", onMouseMove);
  showSplashText("Perdu !", 1000);

  setTimeout(() => {
    _finalize(stage);
    resolve(false);
  }, 1200);
}

function _triggerVictory(arena, stage, onMouseMove, resolve) {
  if (state._isOver) return;
  state._isOver = true;

  // Feu d'artifice de la victoire
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      _burstParticles(
        _rnd(80, state.ARENA_W - 80),
        _rnd(60, state.ARENA_H - 60),
        20,
        `hsl(${_rndInt(0, 360)},100%,60%)`,
        "#fff"
      );
    }, i * 150);
  }

  arena.style.boxShadow = "inset 0 0 120px #22c55e";

  cancelAnimationFrame(state._raf);
  state._intervals.forEach(clearInterval);
  state._timeouts.forEach(clearTimeout);
  arena.removeEventListener("mousemove", onMouseMove);
  showSplashText("Victoire !", 1000);

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