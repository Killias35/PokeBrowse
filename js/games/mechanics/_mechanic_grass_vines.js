import { _rnd } from "../utils.js";
import { _addInterval, _spawnParticle, _hitRect } from "../game-engine.js";


// ─── 🌿 PLANTE : lianes traversantes (horizontales & verticales)
export function _mechanic_grass_vines(cfg, difficulty, state) {
    const spawnDelay    = Math.max(200, 700 - difficulty * 50);
    const vineSpeed     = Math.min(2.5, 1 + difficulty * 0.15);
    const vineW         = Math.min(9, 5 + difficulty * 0.4);

    function spawnVine(horizontal) {
        if (state._isOver) return;
        const el = document.createElement("div");
        el.className = "dp-vine dp-projectile";
        let x, y, vx, vy;

        if (horizontal) {
        y = _rnd(20, state.ARENA_H - 20);
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
        x = _rnd(20, state.ARENA_W - 20);
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
        state._arena.appendChild(el);

        const obj = { el, x, y, vx, vy, w: horizontal ? 40 : vineW, h: horizontal ? vineW : 40, horizontal, type: "vine" };
        state._objects.push(obj);
    }

    _addInterval(() => spawnVine(true),  spawnDelay);
    _addInterval(() => spawnVine(false), spawnDelay);
    spawnVine(true);

    return function update() {
        for (let i = state._objects.length - 1; i >= 0; i--) {
        const o = state._objects[i];
        if (o.type !== "vine") continue;
        o.x += o.vx; o.y += o.vy;

        // Étirer la liane visuellement
        if (o.horizontal) {
            o.w = Math.min(o.w + o.vx * 0.5, state.ARENA_W + 40);
            o.el.style.width  = `${o.w}px`;
            o.el.style.left   = `${o.x}px`;
        } else {
            o.h = Math.min(o.h + o.vy * 0.5, state.ARENA_H + 40);
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
        if (_hitRect(state._playerX, state._playerY, state.PLAYER_RADIUS, ox, oy, o.w, o.h)) return true;

        if (o.x > state.ARENA_W + 50 || o.y > state.ARENA_H + 50) {
            o.el.remove(); state._objects.splice(i, 1);
        }
        }
        return false;
    };
}