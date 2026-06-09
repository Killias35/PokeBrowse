import { _rnd } from "../utils.js";
import { _addInterval, _arenaFlash, _burstParticles, _screenShake, _spawnParticle, _hitCircle } from "../game-engine.js";



// ─── 🪨 ROCHE : météorites massives avec ombre au sol
export function _mechanic_Eboulement(cfg, difficulty, state) {
    const spawnDelay = Math.max(150, 400 - difficulty * 25);
    const shadowMargin = 10;

    function spawnBoulder() {
        if (state._isOver) return;
        const size = Math.max(80, 20 + difficulty * 6);
        const speed = Math.min(14, _rnd(2.5, 3.5) * (1 + difficulty * 0.1));
        const x = _rnd(size/2, state.ARENA_W - size/2);
        
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
        state._arena.appendChild(el);

        // Ombre au sol (cible de tombée)
        const shadow = document.createElement("div");
        shadow.style.cssText = `
        position:absolute;
        width:${size * 0.7}px; height:${size * 0.3}px;
        left:${x}px; top:${state.ARENA_H - shadowMargin}px;
        transform:translate(-50%,-50%);
        background: radial-gradient(ellipse, rgba(0,0,0,0.5), transparent);
        border-radius:50%; pointer-events:none;
        `;
        state._arena.appendChild(shadow);

        state._objects.push({ el, shadow, x, y: -size, vy: speed, size, type: "boulder" });
    }

    _addInterval(spawnBoulder, spawnDelay);
    spawnBoulder();

    return function update() {
        for (let i = state._objects.length - 1; i >= 0; i--) {
        const o = state._objects[i];
        if (o.type !== "boulder") continue;
        o.vy += 0.1; // gravité
        o.y  += o.vy;
        o.el.style.top = `${o.y}px`;

        // La taille de l'ombre diminue à l'approche
        const shadowScale = Math.min(1, o.y / (state.ARENA_H - o.size));
        o.shadow.style.opacity = shadowScale;

        // Particules de débris dans la chute
        if (Math.random() < 0.15) {
            _spawnParticle(o.x + _rnd(-o.size / 3, o.size / 3), o.y - o.size / 3, {
            color: cfg.color, size: _rnd(3, 8),
            vx: _rnd(-2, 2), vy: _rnd(-2, 1), life: 350
            });
        }

        if (_hitCircle(state._playerX, state._playerY, state.PLAYER_RADIUS, o.x, o.y, o.size * 0.45)) {
            _screenShake(15, 400);
            _burstParticles(o.x, o.y, 20, cfg.color, cfg.accent);
            return true;
        }

        if (o.y > state.ARENA_H - shadowMargin / 2) {
            // Impact au sol
            _screenShake(8, 300);
            _burstParticles(o.x, state.ARENA_H, 15, cfg.color, cfg.accent);
            _arenaFlash(cfg.color, 100);
            o.el.remove();
            o.shadow.remove();
            state._objects.splice(i, 1);
        }
        }
        return false;
    };
}