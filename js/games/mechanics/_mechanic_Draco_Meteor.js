import { _rnd } from "../utils.js";
import { _addTimeout, _addInterval, _arenaFlash, _spawnParticle, _hitCircle } from "../game-engine.js";


// ─── 🐉 DRAGON : spirales imbriquées multi-couches
export function _mechanic_Draco_Meteor(cfg, difficulty, state) {

    // ── Paramètres ────────────────────────────────────────────────────────

    const ARMS          = Math.min(15, 10 + difficulty/2);
    const orbitSpeed    = 0.01;
    const meteorSpeed   = Math.min(2, 1.5 + difficulty * 0.05);
    const shootInterval = Math.max(300, 520 - difficulty * 38);
    const burstCount    = Math.min(8, 3 + Math.floor(difficulty / 2));
    const burstPause    = Math.max(200, 1700 - difficulty * 150);

    let angle       = 0;
    let salvesFired = 0;
    let pausing     = false;


    function _setShootingInterval() {
        _addInterval(shootSalve, shootInterval);
    }

    function _showCenterWarning(state, cfg) {
        const el = document.createElement("div");
        el.style.cssText = `
            position: absolute;
            left: ${state.ARENA_W / 2}px;
            top:  ${state.ARENA_H / 2}px;
            transform: translate(-50%, -50%);
            width: 60px; height: 60px;
            border-radius: 50%;
            border: 2px solid ${cfg.color};
            box-shadow: 0 0 18px ${cfg.color};
            pointer-events: none;
            z-index: 20;
            animation: _cwPulse 0.45s ease-out 3;
        `;

        const label = document.createElement("div");
        label.style.cssText = `
            position: absolute;
            left: ${state.ARENA_W / 2}px;
            top:  ${state.ARENA_H / 2 - 44}px;
            transform: translateX(-50%);
            color: ${cfg.color};
            font-size: 11px;
            font-family: sans-serif;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            pointer-events: none;
            z-index: 20;
            opacity: 0;
            animation: _cwFade 1.4s ease forwards;
        `;
        label.textContent = "⚠ Évite le centre";

        if (!document.getElementById("_cw-style")) {
            const s = document.createElement("style");
            s.id = "_cw-style";
            s.textContent = `
                @keyframes _cwPulse {
                    0%   { transform: translate(-50%,-50%) scale(0.6); opacity: 1; }
                    100% { transform: translate(-50%,-50%) scale(2.2); opacity: 0; }
                }
                @keyframes _cwFade {
                    0%   { opacity: 0; }
                    20%  { opacity: 1; }
                    70%  { opacity: 1; }
                    100% { opacity: 0; }
                }
            `;
            document.head.appendChild(s);
        }

        state._arena.appendChild(el);
        state._arena.appendChild(label);

        setTimeout(() => { el.remove(); label.remove(); }, 1400);
    }

    // ── Tir d'une salve (toutes les couches simultanément) ─────────────────
    function shootSalve() {
        if (state._isOver || pausing) return;

        for (let arm = 0; arm < ARMS; arm++) {
            const a  = angle + (arm / ARMS) * Math.PI * 2;
            const sx = state.ARENA_W / 2 + Math.cos(a) * 15;
            const sy = state.ARENA_H / 2 + Math.sin(a) * 15;
            const vx = Math.cos(a) * meteorSpeed;
            const vy = Math.sin(a) * meteorSpeed;

            const size = _rnd(9, 16);
            const el   = document.createElement("div");
            el.className = "dp-projectile";
            el.style.cssText = `
                position: absolute;
                width:  ${size}px; height: ${size}px;
                left:   ${sx}px;   top:    ${sy}px;
                transform: translate(-50%, -50%);
                border-radius: 40%;
                background: radial-gradient(circle at 35% 35%, ${cfg.accent}, ${cfg.color} 70%);
                box-shadow: 0 0 10px ${cfg.color}, 0 0 18px ${cfg.accent}88;
                pointer-events: none;
            `;
            state._arena.appendChild(el);
            state._objects.push({ el, x: sx, y: sy, vx, vy, size, type: "meteor" });

            _spawnParticle(sx, sy, {
                color: cfg.accent, size: _rnd(3, 7),
                vx: -vx * 0.2, vy: -vy * 0.2, life: 220
            });
        }

        salvesFired++;
        if (salvesFired >= burstCount) {
            salvesFired = 0;
            pausing     = true;
            _arenaFlash(cfg.color, 180);
            setTimeout(() => { pausing = false; }, burstPause);
        }
    }

    _showCenterWarning(state, cfg);
    _addTimeout(_setShootingInterval, 1000);


    // ── Update ────────────────────────────────────────────────────────────
    return function update() {
        if (state._isOver) return false;

        angle += orbitSpeed;

        for (let i = state._objects.length - 1; i >= 0; i--) {
            const o = state._objects[i];
            if (o.type !== "meteor") continue;

            o.x += o.vx;
            o.y += o.vy;
            o.el.style.left = `${o.x}px`;
            o.el.style.top  = `${o.y}px`;

            if (_hitCircle(
                state._playerX, state._playerY, state.PLAYER_RADIUS,
                o.x, o.y, o.size / 2
            )) return true;

            if (o.x < -40 || o.x > state.ARENA_W + 40 ||
                o.y < -40 || o.y > state.ARENA_H + 40) {
                o.el.remove();
                state._objects.splice(i, 1);
            }
        }

        return false;
    };
}