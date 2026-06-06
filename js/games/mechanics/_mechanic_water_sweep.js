import { _rnd, _rndInt } from "../utils.js";
import { _addInterval, ARENA_H, ARENA_W, PLAYER_RADIUS } from "../game-engine.js";

// ─── 💧 EAU : Hydrocanon façon Gaster Blaster
export function _mechanic_water_sweep(cfg, difficulty, _isOver) {

  const spawnDelay = Math.max(500, 2000 - difficulty * 300);
  const chargeDuration = Math.max(40, 80 - difficulty * 5);
  const beamDuration = Math.max(20, difficulty * 10);
  const beamHeight = Math.min(70, 10 + difficulty * 10);

  function spawnHydroCanon(beamHeight) {

    if (_isOver) return;

    const side = _rndInt(0, 3);

    let sx, sy;

    switch (side) {
      case 0: // haut
        sx = _rnd(60, ARENA_W - 60);
        sy = -40;
        break;

      case 1: // bas
        sx = _rnd(60, ARENA_W - 60);
        sy = ARENA_H + 40;
        break;

      case 2: // gauche
        sx = -40;
        sy = _rnd(60, ARENA_H - 60);
        break;

      default: // droite
        sx = ARENA_W + 40;
        sy = _rnd(60, ARENA_H - 60);
        break;
    }

    // Cible proche du joueur mais pas exacte
    const tx = _playerX + _rnd(-80, 80);
    const ty = _playerY + _rnd(-80, 80);

    const dx = tx - sx;
    const dy = ty - sy;
    const angle = Math.atan2(dy, dx);
    const length = Math.hypot(dx, dy) + 500;

    // Télégraphe
    const telegraph = document.createElement("div");
    telegraph.className = "dp-projectile";

    telegraph.style.cssText = `
      position:absolute;
      left:${sx}px;
      top:${sy}px;
      width:${length}px;
      height:4px;
      transform-origin:left center;
      transform:rotate(${angle}rad);
      background:${cfg.accent};
      opacity:.25;
      box-shadow:0 0 8px ${cfg.accent};
      pointer-events:none;
    `;

    _arena.appendChild(telegraph);

    const obj = {
      type: "hydro",
      telegraph,
      sx,
      sy,
      angle,
      length,
      charge: chargeDuration,
      active: false,
      beam: null,
      life: beamDuration,
      height: beamHeight
    };

    _objects.push(obj);
  }

  _addInterval(() => spawnHydroCanon(beamHeight) ,spawnDelay);
  spawnHydroCanon(beamHeight);

  return function update() {

    for (let i = _objects.length - 1; i >= 0; i--) {

      const o = _objects[i];

      if (o.type !== "hydro") continue;

      // PHASE DE CHARGE
      if (!o.active) {

        o.charge--;

        const progress = 1 - o.charge / chargeDuration;

        o.telegraph.style.opacity =
          0.15 + progress * 0.5;

        // Particules qui convergent vers la bouche
        for (let p = 0; p < 3; p++) {

          const a = Math.random() * Math.PI * 2;
          const r = _rnd(20, 60);

          const px = o.sx + Math.cos(a) * r;
          const py = o.sy + Math.sin(a) * r;

          const vx = (o.sx - px) * 0.08;
          const vy = (o.sy - py) * 0.08;

          _spawnParticle(px, py, {
            color: Math.random() < 0.5
              ? cfg.color
              : cfg.accent,
            size: _rnd(2, 5),
            vx,
            vy,
            life: 250
          });
        }

        // Tir
        if (o.charge <= 0) {

          o.active = true;

          _arenaFlash(cfg.accent, 120);

          _burstParticles(
            o.sx,
            o.sy,
            30,
            cfg.color,
            cfg.accent
          );

          const beam = document.createElement("div");

          beam.className = "dp-projectile";

          beam.style.cssText = `
            position:absolute;
            left:${o.sx}px;
            top:${o.sy}px;
            width:${o.length}px;
            height:${o.height}px;
            transform-origin:left center;
            transform:rotate(${o.angle}rad);
            border-radius:20px;
            background:linear-gradient(
              90deg,
              ${cfg.color},
              white,
              ${cfg.accent}
            );
            box-shadow:
              0 0 10px white,
              0 0 25px ${cfg.accent},
              0 0 50px ${cfg.color};
            pointer-events:none;
          `;

          _arena.appendChild(beam);

          o.beam = beam;

          o.telegraph.remove();
        }

        continue;
      }

      // Rayon actif
      o.life--;

      // Spray aquatique
      for (let p = 0; p < 5; p++) {

        const dist = _rnd(0, o.length);

        const px =
          o.sx + Math.cos(o.angle) * dist;

        const py =
          o.sy + Math.sin(o.angle) * dist;

        _spawnParticle(px, py, {
          color: cfg.accent,
          size: _rnd(2, 5),
          vx: _rnd(-1, 1),
          vy: _rnd(-1, 1),
          life: 200
        });
      }

      // Collision rayon
      const proj =
        (_playerX - o.sx) * Math.cos(o.angle) +
        (_playerY - o.sy) * Math.sin(o.angle);

      const perp =
        Math.abs(
          -(_playerX - o.sx) * Math.sin(o.angle) +
          (_playerY - o.sy) * Math.cos(o.angle)
        );

      if (
        proj >= 0 &&
        proj <= o.length &&
        perp < PLAYER_RADIUS + o.height / 2
      ) {
        return true;
      }

      if (o.life <= 0) {

        if (o.beam) o.beam.remove();

        _objects.splice(i, 1);
      }
    }

    return false;
  };
}