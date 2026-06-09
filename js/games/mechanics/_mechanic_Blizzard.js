import { _rnd } from "../utils.js";
import { _addInterval, _arenaFlash, _burstParticles, _hitCircle } from "../game-engine.js";

// ─── ❄️ GLACE : projectiles froids + gels qui ralentissent
export function _mechanic_Blizzard(cfg, difficulty, state) {
    const spawnDelay = Math.max(40, 100 - difficulty * 8);
    // Direction du blizzard
    const blizzardAngle = Math.random() * Math.PI * 2;
    const force  = Math.min(4, 1 + difficulty * 0.25);
    const speed  = Math.min(3, 1 + difficulty * 0.25);
    const unFreezeSpeed = Math.max(0.25, 1 - difficulty * 0.1);

    // Vent permanent
    state._windX = Math.cos(blizzardAngle) * force;
    state._windY = Math.abs(Math.sin(blizzardAngle) * force);

    function spawnSnow() {
        const el = document.createElement("div");
        const size = _rnd(2, 6);

        const startX = _rnd(0, state.ARENA_W);
        const startY = 0;

        el.style.cssText = `
            position:absolute;
            width:${size}px;
            height:${size}px;
            border-radius:50%;
            background:${cfg.accent};
            opacity:0.7;
            pointer-events:none;
        `;

        state._arena.appendChild(el);

        state._objects.push({
            type:"snow",
            el,
            x:startX,
            y:startY,
            vx: state._windX,
            vy: state._windY * 3 + 1
        });
        }

        _addInterval(spawnSnow, 20);

    function spawnIceShard() {
        if (state._isOver) return;
        const x = _rnd(0, state.ARENA_W);
        const y = -20;
        const size = _rnd(12, 26);
        const speedY = speed * size * 0.1;
        const speedX = state._windX * 10;

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
        state._arena.appendChild(el);
        state._objects.push({ el, x, y, vx: speedX, vy: speedY, size, type: "iceshard", isFreezer: true });
    }

    _addInterval(spawnIceShard, spawnDelay);
    for(let i = 0; i < 40; i++) {
        spawnSnow();
    }
    spawnIceShard();

    return function update() {
        state._playerX += state._windX;
        state._playerY += state._windY;

        // Gel progressif
        if (state._freezeTimer > 0) {
        state._freezeTimer -= 0.016 * unFreezeSpeed;
        if (state._freezeTimer < 0) state._freezeTimer = 0;
        // Friction réduite par le gel
        state._friction = 0.03 + (0.05 * (1 - state._freezeTimer / state._freezeMax));
        } else {
        state._friction = 0.08;
        }

        for (let i = state._objects.length - 1; i >= 0; i--) {
            const o = state._objects[i];

            // ─── Flocons du blizzard
            if (o.type === "snow") {

                o.x += o.vx;
                o.y += o.vy;

                o.el.style.left = `${o.x}px`;
                o.el.style.top = `${o.y}px`;

                if (
                    o.x < -50 ||
                    o.x > state.ARENA_W + 50 ||
                    o.y < -50 ||
                    o.y > state.ARENA_H + 50
                ) {
                    o.el.remove();
                    state._objects.splice(i, 1);
                }

                continue;
            }

            // ─── Grelons
            if (o.type !== "iceshard") continue;
            o.y += o.vy;
            o.el.style.top  = `${o.y}px`;
            o.el.style.left = `${o.x}px`;

            if (_hitCircle(state._playerX, state._playerY, state.PLAYER_RADIUS, o.x, o.y, o.size / 2)) {
                if (o.isFreezer) {
                // Gel partiel — ralentit mais ne tue pas (sauf si déjà gelé max)
                if (state._freezeTimer >= state._freezeMax * 0.3) return true;
                state._freezeTimer = Math.min(state._freezeMax, state._freezeTimer + 1.5);
                state._freezeMax = Math.max(state._freezeMax, state._freezeTimer);
                _arenaFlash(cfg.color, 200);
                _burstParticles(o.x, o.y, 10, cfg.color, cfg.accent);
                o.el.remove(); state._objects.splice(i, 1);
                } else {
                return true;
                }
                continue;
            }
            if (o.y > state.ARENA_H + 20) { o.el.remove(); state._objects.splice(i, 1); }
        }
        return false;
    };
}