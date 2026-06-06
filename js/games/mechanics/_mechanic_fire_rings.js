import { _rnd, _rndInt } from "../utils.js";
import { _addInterval, _spawnParticle, _arenaFlash, _burstParticles } from "../game-engine.js";

// ─── 🔥 FEU : anneaux concentriques qui explosent vers l'extérieur
export function _mechanic_fire_rings(cfg, difficulty, state) {
  const colors = [cfg.color, cfg.accent, "#ff6a00"];
  let spawnDelay = Math.max(800, 2000 - difficulty * 200);

  function spawnRing() {
    if (state._isOver) return;
    // Taille de départ et vitesse d'expansion
    const spawnDelay = Math.max(15, 60 - difficulty * 10);   // temps avant expension en image
    const startSize = _rnd(20, 60);                         // taille de départ
    const maxSize = startSize * 2 * (1 + difficulty * 0.5); // taille maximale
    const expandSpeed = _rnd(2, 4) * (1 + difficulty * 0.1);// vitesse d'expansion
    const color = colors[_rndInt(0, colors.length - 1)];    // couleur

    const el = document.createElement("div");
    el.className = "dp-ring dp-projectile";
    const cx = _rnd(80, state.ARENA_W - 80);
    const cy = _rnd(60, state.ARENA_H - 60);
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
    state._arena.appendChild(el);

    // Petite explosion de particules au spawn
    _burstParticles(cx, cy, 8, cfg.color, cfg.accent);
    _arenaFlash(cfg.color, 80);

    const obj = { el, cx, cy, r: startSize / 2, expandSpeed, type: "ring", alive: true, maxSize, spawnDelay };
    state._objects.push(obj);

    // Particules de feu qui brûlent le long de l'anneau
    const trailInterval = setInterval(() => {
      if (!obj.alive || state._isOver) { clearInterval(trailInterval); return; }
      const angle = Math.random() * Math.PI * 2;
      _spawnParticle(cx + Math.cos(angle) * obj.r, cy + Math.sin(angle) * obj.r, {
        color: Math.random() < 0.5 ? cfg.color : cfg.accent,
        size: _rnd(3, 8), vx: Math.cos(angle) * _rnd(0.5, 2), vy: _rnd(-3, -1), life: 400
      });
    }, 40);

    state._intervals.push(trailInterval);
  }

  const spawnInterval = _addInterval(spawnRing, spawnDelay);
  spawnRing(); // Premier anneau immédiat

  return function update(now) {
    for (let i = state._objects.length - 1; i >= 0; i--) {
      const o = state._objects[i];
      if (o.type !== "ring" || !o.alive) continue;
      if(o.spawnDelay > 0) { 
        o.spawnDelay -= 1; 
        _spawnParticle(o.cx, o.cy, { color: cfg.color, size: _rnd(3, 8), vx: 0, vy: 0, life: 100 });
        continue; 
      } 
      o.r += o.expandSpeed;
      const d = o.r * 2;
      if (o.r > o.maxSize) {
        o.el.remove();
        o.alive = false;
        state._objects.splice(i, 1);
        continue;
      }
      o.el.style.width  = `${d}px`;
      o.el.style.height = `${d}px`;

      // Collision joueur
      const dist = Math.hypot(state._playerX - o.cx, state._playerY - o.cy);
      const ringThickness = 12;
      if (Math.abs(dist - o.r) < state.PLAYER_RADIUS + ringThickness) {
        return true; // TOUCHÉ
      }

      // Sortie d'arène
      if (d > state.ARENA_H) {
        o.el.remove();
        o.alive = false;
        state._objects.splice(i, 1);
      }
    }
    return false;
  };
}