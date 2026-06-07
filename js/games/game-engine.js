import { showSplashText } from "../battle-annimation.js";
import { _rnd, _rndInt } from "./utils.js";
import { ATTACK_CONFIGS } from "./attack_configs.js";

import { _mechanic_water_sweep } from "./mechanics/_mechanic_water_sweep.js";
import { _mechanic_fire_rings } from "./mechanics/_mechanic_fire_rings.js";
import { _mechanic_electric_bolts } from "./mechanics/_mechanic_electric_bolts.js";
import { _mechanic_grass_vines } from "./mechanics/_mechanic_grass_vines.js";
import { _mechanic_ice_freeze } from "./mechanics/_mechanic_ice_freeze.js";
import { _mechanic_ground_shockwaves } from "./mechanics/_mechanic_ground_shockwaves.js";
import { _mechanic_rock_boulders } from "./mechanics/_mechanic_rock_boulders.js";
import { _mechanic_flying_gusts } from "./mechanics/_mechanic_flying_gusts.js";
import { _mechanic_psychic_distort } from "./mechanics/_mechanic_psychic_distort.js";
import { _mechanic_bug_swarm } from "./mechanics/_mechanic_bug_swarm.js";

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

// ============================================================
//   MÉCANIQUES DE JEU (une par type)
// ============================================================



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
  state._arena.appendChild(darkOverlay);
  state._objects.push({ el: darkOverlay, type: "overlay" });

  function spawnGhost() {
    if (state._isOver) return;
    const x = _rnd(30, state.ARENA_W - 30);
    const y = _rnd(30, state.ARENA_H - 30);
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
    state._arena.appendChild(el);

    const obj = { el, x, y, r: size / 2, type: "ghost_zone", alive: true };
    state._objects.push(obj);

    _addTimeout(() => {
      if (!obj.alive) return;
      obj.alive = false;
      el.style.opacity = "0";
      el.style.transition = "opacity 0.4s";
      _addTimeout(() => {
        el.remove();
        const idx = state._objects.indexOf(obj);
        if (idx > -1) state._objects.splice(idx, 1);
      }, 400);
    }, linger);
  }

  _addInterval(spawnGhost, Math.max(600, 1500 - difficulty * 100));
  spawnGhost();

  return function update() {
    // Déplace le halo de visibilité autour du joueur
    const px = (state._playerX / state.ARENA_W * 100).toFixed(1);
    const py = (state._playerY / state.ARENA_H * 100).toFixed(1);
    darkOverlay.style.setProperty("--ox", `${px}%`);
    darkOverlay.style.setProperty("--oy", `${py}%`);

    for (const o of state._objects) {
      if (o.type !== "ghost_zone" || !o.alive) continue;
      if (_hitCircle(state._playerX, state._playerY, state.PLAYER_RADIUS, o.x, o.y, o.r)) return true;
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
    if (state._isOver) return;
    for (let arm = 0; arm < ARMS; arm++) {
      const a = angle + (arm / ARMS) * Math.PI * 2;
      const sx = state.ARENA_W / 2 + Math.cos(a) * orbitRadius;
      const sy = state.ARENA_H / 2 + Math.sin(a) * orbitRadius;

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
      state._arena.appendChild(el);

      // Direction : vers l'extérieur depuis le centre
      const vx = Math.cos(a) * projectileSpeed;
      const vy = Math.sin(a) * projectileSpeed;
      state._objects.push({ el, x: sx, y: sy, vx, vy, size, type: "meteor" });

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
    for (let i = state._objects.length - 1; i >= 0; i--) {
      const o = state._objects[i];
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

      if (_hitCircle(state._playerX, state._playerY, state.PLAYER_RADIUS, o.x, o.y, o.size / 2)) return true;
      if (o.x < -40 || o.x > state.ARENA_W + 40 || o.y < -40 || o.y > state.ARENA_H + 40) {
        o.el.remove(); state._objects.splice(i, 1);
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
    if (state._isOver) return;
    const x = _rnd(40, state.ARENA_W - 40);
    const y = _rnd(40, state.ARENA_H - 40);
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
    state._arena.appendChild(el);

    let charging = true;
    const obj = { el, x, y, r: size / 2, type: "mine", charging: true };
    state._objects.push(obj);

    // Phase de charge : la mine grossit et devient plus visible
    let chargeProgress = 0;
    const chargeInterval = setInterval(() => {
      if (state._isOver || !charging) { clearInterval(chargeInterval); return; }
      chargeProgress = Math.min(1, chargeProgress + (16 / DELAY));
      el.style.border = `3px solid ${cfg.accent}${Math.floor(chargeProgress * 255).toString(16).padStart(2, "0")}`;
      el.style.boxShadow = `0 0 ${chargeProgress * 30}px ${cfg.accent}`;
    }, 16);
    state._intervals.push(chargeInterval);

    // Explosion
    _addTimeout(() => {
      if (state._isOver) return;
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
        const idx = state._objects.indexOf(obj);
        if (idx > -1) state._objects.splice(idx, 1);
      }, BLAST_DURATION);
    }, DELAY);
  }

  _addInterval(spawnMine, Math.max(600, 1500 - difficulty * 100));
  spawnMine();

  return function update() {
    for (const o of state._objects) {
      if (o.type !== "mine") continue;
      if (_hitCircle(state._playerX, state._playerY, state.PLAYER_RADIUS, o.x, o.y, o.r)) return true;
    }
    return false;
  };
}

// ─── ⚙️ ACIER : murs latéraux qui se referment
function _mechanic_steel_walls(cfg, difficulty) {
  const CLOSE_SPEED = 0.6 + difficulty * 0.1;

  function spawnWallPair() {
    if (state._isOver) return;
    const isHorizontal = Math.random() < 0.4;

    if (!isHorizontal) {
      // Murs gauche/droite
      const leftEl = document.createElement("div");
      const rightEl = document.createElement("div");
      const wallH = _rnd(80, 160);
      const wallY = _rnd(0, state.ARENA_H - wallH);
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
      rightEl.style.cssText = baseStyle + `left: ${state.ARENA_W - 30}px; border-radius: 6px 0 0 6px;`;

      state._arena.appendChild(leftEl);
      state._arena.appendChild(rightEl);

      let lx = 0, rx = state.ARENA_W - 30;
      const lw = 30, rw = 30;
      const target = (state.ARENA_W - gap) / 2;

      const wObj = {
        el: leftEl, el2: rightEl,
        lx, rx, wallY, wallH, lw, rw,
        target, speed: CLOSE_SPEED, isClosing: true,
        type: "wall_pair"
      };
      state._objects.push(wObj);

      // Scintillement métallique
      for (let i = 0; i < 8; i++) {
        _addTimeout(() => {
          if (state._isOver) return;
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
      const wallX = _rnd(0, state.ARENA_W - wallW);
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
      botEl.style.cssText = baseStyle + `top:${state.ARENA_H - 25}px; border-radius: 6px 6px 0 0;`;

      state._arena.appendChild(topEl);
      state._arena.appendChild(botEl);

      state._objects.push({
        el: topEl, el2: botEl,
        ty: 0, by: state.ARENA_H - 25,
        wallX, wallW, wallH: 25,
        gap, speed: CLOSE_SPEED, isHorizontal: true,
        type: "wall_pair_h"
      });
    }
  }

  _addInterval(spawnWallPair, Math.max(1500, 3000 - difficulty * 200));
  _addTimeout(spawnWallPair, 300);

  return function update() {
    for (let i = state._objects.length - 1; i >= 0; i--) {
      const o = state._objects[i];

      if (o.type === "wall_pair") {
        if (o.isClosing) {
          o.lx = Math.min(o.lx + o.speed, o.target);
          o.rx = Math.max(o.rx - o.speed, state.ARENA_W - o.target - o.rw);
          o.el.style.left  = `${o.lx}px`;
          o.el2.style.left = `${o.rx}px`;

          // Collision
          if (_hitRect(state._playerX, state._playerY, state.PLAYER_RADIUS, o.lx, o.wallY, o.lw, o.wallH)) return true;
          if (_hitRect(state._playerX, state._playerY, state.PLAYER_RADIUS, o.rx, o.wallY, o.rw, o.wallH)) return true;

          if (o.lx >= o.target) {
            o.isClosing = false;
            _screenShake(12, 300);
            _arenaFlash(cfg.color, 200);
            _addTimeout(() => {
              o.el.remove(); o.el2.remove();
              state._objects.splice(state._objects.indexOf(o), 1);
            }, 800);
          }
        }
      }

      if (o.type === "wall_pair_h") {
        o.ty = Math.min(o.ty + o.speed, (state.ARENA_H - o.gap) / 2 - o.wallH);
        o.by = Math.max(o.by - o.speed, (state.ARENA_H + o.gap) / 2);
        o.el.style.top  = `${o.ty}px`;
        o.el2.style.top = `${o.by}px`;

        if (_hitRect(state._playerX, state._playerY, state.PLAYER_RADIUS, o.wallX, o.ty, o.wallW, o.wallH)) return true;
        if (_hitRect(state._playerX, state._playerY, state.PLAYER_RADIUS, o.wallX, o.by, o.wallW, o.wallH)) return true;

        if (o.ty >= (state.ARENA_H - o.gap) / 2 - o.wallH) {
          _screenShake(10, 300);
          _addTimeout(() => {
            o.el.remove(); o.el2.remove();
            const idx = state._objects.indexOf(o);
            if (idx > -1) state._objects.splice(idx, 1);
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
    if (state._isOver) return;
    const x = _rnd(0, state.ARENA_W);
    const y = _rnd(0, state.ARENA_H);
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
    state._arena.appendChild(el);

    const obj = { el, x, y, r: 5, finalR: finalSize / 2, growSpeed: 0.4, type: "cloud" };
    state._objects.push(obj);
    clouds.push(obj);

    // Particules de gaz
    const gasInterval = setInterval(() => {
      if (state._isOver || obj.r >= obj.finalR) { clearInterval(gasInterval); return; }
      _spawnParticle(x + _rnd(-obj.r, obj.r), y + _rnd(-obj.r, obj.r), {
        color: cfg.color, size: _rnd(3, 8),
        vx: _rnd(-1, 1), vy: _rnd(-2, -0.5), life: 600, glow: true
      });
    }, 80);
    state._intervals.push(gasInterval);
  }

  _addInterval(spawnCloud, Math.max(800, 2000 - difficulty * 150));
  spawnCloud();

  return function update() {
    for (const o of state._objects) {
      if (o.type !== "cloud") continue;
      if (o.r < o.finalR) o.r += o.growSpeed;
      const d = o.r * 2;
      o.el.style.width  = `${d}px`;
      o.el.style.height = `${d}px`;

      if (_hitCircle(state._playerX, state._playerY, state.PLAYER_RADIUS, o.x, o.y, o.r * 0.7)) return true;
    }
    return false;
  };
}

// ─── 🥊 COMBAT : poings géants qui smashent des zones
function _mechanic_fighting_punches(cfg, difficulty) {
  const WARNING_DURATION = Math.max(500, 1000 - difficulty * 60);

  function spawnPunch() {
    if (state._isOver) return;
    // Vise légèrement le joueur
    const targetX = state._playerX + _rnd(-80, 80);
    const targetY = state._playerY + _rnd(-60, 60);
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
    state._arena.appendChild(warn);

    _addTimeout(() => {
      if (state._isOver) { warn.remove(); return; }
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
      state._arena.appendChild(impact);

      _addTimeout(() => { impact.style.transform = "translate(-50%,-50%) scale(1)"; }, 10);

      _screenShake(12, 350);
      _arenaFlash(cfg.color, 120);
      _burstParticles(targetX, targetY, 18, cfg.color, cfg.accent);

      const obj = { el: impact, x: targetX, y: targetY, r: size / 2, type: "punch_zone" };
      state._objects.push(obj);

      _addTimeout(() => {
        impact.style.transition = "opacity 0.3s";
        impact.style.opacity = "0";
        _addTimeout(() => {
          impact.remove();
          const idx = state._objects.indexOf(obj);
          if (idx > -1) state._objects.splice(idx, 1);
        }, 300);
      }, 300);
    }, WARNING_DURATION);
  }

  _addInterval(spawnPunch, Math.max(600, 1400 - difficulty * 100));
  _addTimeout(spawnPunch, 200);

  return function update() {
    for (const o of state._objects) {
      if (o.type !== "punch_zone") continue;
      if (_hitCircle(state._playerX, state._playerY, state.PLAYER_RADIUS, o.x, o.y, o.r * 0.7)) return true;
    }
    return false;
  };
}

// ─── 🌟 FÉE : cercles enchantés qui explosent
function _mechanic_fairy_circles(cfg, difficulty) {
  const LINGER_MS = Math.max(1000, 2500 - difficulty * 150);

  function spawnCircle() {
    if (state._isOver) return;
    const x = _rnd(50, state.ARENA_W - 50);
    const y = _rnd(50, state.ARENA_H - 50);
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
    state._arena.appendChild(el);

    // Pétales de fée
    for (let i = 0; i < 6; i++) {
      _addTimeout(() => {
        if (state._isOver) return;
        const angle = Math.random() * Math.PI * 2;
        _spawnParticle(x + Math.cos(angle) * size / 2, y + Math.sin(angle) * size / 2, {
          color: Math.random() < 0.5 ? cfg.color : cfg.accent,
          size: _rnd(4, 9), vx: Math.cos(angle + 1.5) * 2, vy: Math.sin(angle + 1.5) * 2 - 1, life: 800
        });
      }, i * 150);
    }

    const obj = { el, x, y, r: size / 2, type: "fairy_circle", alive: true };
    state._objects.push(obj);

    _addTimeout(() => {
      if (!obj.alive || state._isOver) return;
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
          const idx = state._objects.indexOf(obj);
          if (idx > -1) state._objects.splice(idx, 1);
        }, 300);
      }, 300);
    }, LINGER_MS);
  }

  _addInterval(spawnCircle, Math.max(700, 1800 - difficulty * 120));
  spawnCircle();

  return function update() {
    for (const o of state._objects) {
      if (o.type !== "fairy_circle" || !o.alive) continue;
      if (_hitCircle(state._playerX, state._playerY, state.PLAYER_RADIUS, o.x, o.y, o.r * 0.8)) return true;
    }
    return false;
  };
}

// ─── 🔘 NORMAL : projectiles classiques tombants (fallback)
function _mechanic_normal_drops(cfg, difficulty) {
  function spawnDrop() {
    if (state._isOver) return;
    const x = _rnd(10, state.ARENA_W - 10);
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
    state._arena.appendChild(el);
    state._objects.push({ el, x, y: -size, vy: speed, size, type: "drop" });
  }

  _addInterval(spawnDrop, Math.max(300, 700 - difficulty * 60));
  spawnDrop();

  return function update() {
    for (let i = state._objects.length - 1; i >= 0; i--) {
      const o = state._objects[i];
      if (o.type !== "drop") continue;
      o.y += o.vy;
      o.el.style.top = `${o.y}px`;
      if (_hitCircle(state._playerX, state._playerY, state.PLAYER_RADIUS, o.x, o.y, o.size / 2)) return true;
      if (o.y > state.ARENA_H + 20) { o.el.remove(); state._objects.splice(i, 1); }
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
    // Inversion PSY
    if (state._invertControls) {
      state._mouseX = state.ARENA_W - rawX;
      state._mouseY = state.ARENA_H - rawY;
    } else {
      state._mouseX = rawX;
      state._mouseY = rawY;
    }
  };
  arena.addEventListener("mousemove", onMouseMove);

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