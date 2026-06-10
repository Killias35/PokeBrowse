import { _rnd } from "../utils.js";
import { _addTimeout, _addInterval, _arenaFlash, _screenShake, _hitCircle, _burstParticles } from "../game-engine.js";


// ─── 🥊 COMBAT : poings géants qui smashent des zones
export function _mechanic_Close_Combat(cfg, difficulty, state) {
    const spawnDelay = Math.max(250, 800 - difficulty * 55);
    const WARNING_DURATION = Math.max(600, 1000 - difficulty * 40);
    const MAX_SIZE = Math.min(400, 200 + difficulty * 20);
    const SIZE = _rnd(MAX_SIZE / 2, MAX_SIZE);

    function spawnPunch() {
        if (state._isOver) return;
        // Vise légèrement le joueur
        const targetX = _rnd(0, state.ARENA_W);
        const targetY = _rnd(0, state.ARENA_H);

        // Zone d'alerte
        const warn = document.createElement("div");
        warn.className = "dp-zone";
        warn.style.cssText = `
        position:absolute;
        width:${SIZE}px; height:${SIZE}px;
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
            width:${SIZE}px; height:${SIZE}px;
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

        const obj = { el: impact, x: targetX, y: targetY, r: SIZE / 2, type: "punch_zone" };
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

    _addInterval(spawnPunch, spawnDelay);

    return function update() {
        for (const o of state._objects) {
        if (o.type !== "punch_zone") continue;
        if (_hitCircle(state._playerX, state._playerY, state.PLAYER_RADIUS, o.x, o.y, o.r * 0.7)) return true;
        }
        return false;
    };
}