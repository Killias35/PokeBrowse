import { _rnd, _rndInt } from "../utils.js";
import { _addInterval, _spawnParticle, _arenaFlash, _burstParticles, _addTimeout, _screenShake, _hitRect } from "../game-engine.js";

// ─── ⚡ ÉLECTRIK : zones qui se téléchargent puis frappent
export function _mechanic_Fatal_Foudre(cfg, difficulty, state) {
    const spawnDelay      = Math.max(300, 800 - difficulty * 50);
    const warningDuration = Math.max(600, 1200 - difficulty * 100);
    const strikeDuration  = Math.min(200, difficulty * 30);
    const width           = Math.max(150, 50 + difficulty * 10);

    function spawnBolt(width) {
        if (state._isOver) return;
        const x = _rnd(40, state.ARENA_W - 40);
        const w = width;

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
        state._arena.appendChild(warn);

        _addTimeout(() => {
        if (state._isOver) { warn.remove(); return; }
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
        state._arena.appendChild(bolt);
        _arenaFlash(cfg.color, 100);
        _screenShake(5, 200);

        // Éclairs de particules
        for (let i = 0; i < 20; i++) {
            _spawnParticle(x + _rnd(-w, w), _rnd(0, state.ARENA_H), {
            color: i % 2 === 0 ? cfg.color : "#fff",
            size: _rnd(2, 5), vx: _rnd(-3, 3), vy: _rnd(-3, 3), life: 300
            });
        }

        // Zone de collision active
        const obj = { el: bolt, x: x - w / 2, y: 0, w, h: state.ARENA_H, type: "strike_zone" };
        state._objects.push(obj);

        _addTimeout(() => {
            bolt.remove();
            const idx = state._objects.indexOf(obj);
            if (idx > -1) state._objects.splice(idx, 1);
        }, strikeDuration);
        }, warningDuration);
    }

    _addInterval(() => spawnBolt(width), spawnDelay);
    _addTimeout(() => spawnBolt(width), 100);

    return function update() {
        for (const o of state._objects) {
        if (o.type !== "strike_zone") continue;
        if (_hitRect(state._playerX, state._playerY, state.PLAYER_RADIUS, o.x, o.y, o.w, o.h)) return true;
        }
        return false;
    };
}