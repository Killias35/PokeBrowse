import { _rnd } from "../utils.js";
import { _addTimeout, _addInterval, _arenaFlash, _screenShake, _spawnParticle, _hitCircle } from "../game-engine.js";


// ─── 🧪 POISON : anneaux toxiques qui rétrécissent vers leur centre
export function _mechanic_poison_cloud(cfg, difficulty, state) {

    // ── Paramètres ────────────────────────────────────────────────────────

    // Rayon initial des anneaux
    const RING_START_R      = state.ARENA_W;

    // Vitesse de rétrécissement (px/frame)
    const SHRINK_SPEED      = Math.min(8, 5 + difficulty * 0.3);

    const MIN_SIZE          = Math.max(75, 100 - difficulty * 2.5);

    // Épaisseur de l'anneau (zone de collision)
    const RING_THICKNESS    = Math.max(10, 22 - difficulty * 1.2);

    // Intervalle entre chaque spawn d'anneau (ms)
    const SPAWN_INTERVAL    = Math.max(350, 800 - difficulty * 45);

    // Distance max du prochain centre par rapport au précédent
    const MAX_NEXT_DIST     = Math.min(200, 100 + difficulty * 10);

    // Marge par rapport aux bords pour le spawn
    const MARGIN            = 50;

    // Dernier centre spawné — pour contraindre le suivant
    let lastCenterX         = state.ARENA_W / 2;
    let lastCenterY         = state.ARENA_H / 2;


    // ── Spawn d'un anneau ─────────────────────────────────────────────────
    function spawnRing() {
        if (state._isOver) return;

        // Centre proche du précédent, dans les marges de l'arène
        const angle  = Math.random() * Math.PI * 2;
        const dist   = _rnd(30, MAX_NEXT_DIST);
        const cx     = Math.max(MARGIN, Math.min(state.ARENA_W - MARGIN, lastCenterX + Math.cos(angle) * dist));
        const cy     = Math.max(MARGIN, Math.min(state.ARENA_H - MARGIN, lastCenterY + Math.sin(angle) * dist));

        lastCenterX  = cx;
        lastCenterY  = cy;

        console.log("Spawn anneau:", MARGIN, state.ARENA_W - MARGIN, lastCenterX + Math.cos(angle) * dist);

        // Indicateur du centre (point cible)
        const dotEl  = document.createElement("div");
        dotEl.style.cssText = `
            position: absolute;
            width:  8px; height: 8px;
            left:   ${cx}px; top: ${cy}px;
            transform: translate(-50%, -50%);
            border-radius: 50%;
            background: ${cfg.accent};
            box-shadow: 0 0 8px ${cfg.accent};
            pointer-events: none;
            z-index: 5;
            opacity: 0.7;
        `;
        state._arena.appendChild(dotEl);
        const dot = { el: dotEl, x: cx, y: cy, r: 8 };
        state._objects.push(dot);

        // Anneau
        const ringEl = document.createElement("div");
        ringEl.style.cssText = `
            position: absolute;
            left:   ${cx}px; top: ${cy}px;
            transform: translate(-50%, -50%);
            border-radius: 50%;
            border: ${RING_THICKNESS}px solid ${cfg.color};
            box-shadow: 0 0 12px ${cfg.color}, inset 0 0 8px ${cfg.color}66;
            pointer-events: none;
            z-index: 4;
            box-sizing: border-box;
        `;
        const startD = RING_START_R * 2;
        ringEl.style.width  = `${startD}px`;
        ringEl.style.height = `${startD}px`;
        state._arena.appendChild(ringEl);

        const obj = {
            el:    ringEl,
            dotEl,
            cx, cy,
            r:     RING_START_R,
            type:  "poison_ring",
        };
        state._objects.push(obj);

        // Particules au spawn
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            _spawnParticle(
                cx + Math.cos(a) * RING_START_R,
                cy + Math.sin(a) * RING_START_R,
                { color: cfg.color, size: _rnd(2, 5),
                  vx: Math.cos(a) * -0.8, vy: Math.sin(a) * -0.8, life: 400 }
            );
        }
    }


    // ── Intervalles ───────────────────────────────────────────────────────
    _addInterval(spawnRing, SPAWN_INTERVAL);

    // ── Update ────────────────────────────────────────────────────────────
    return function update() {
        if (state._isOver) return false;

        for (let i = state._objects.length - 1; i >= 0; i--) {
            const o = state._objects[i];
            if (o.type !== "poison_ring") continue;

            // Rétrécissement
            o.r -= SHRINK_SPEED;

            const d = o.r * 2;
            o.el.style.width  = `${d}px`;
            o.el.style.height = `${d}px`;

            // Particules sur le bord de l'anneau (occasionnelles)
            if (Math.random() < 0.2) {
                const a = Math.random() * Math.PI * 2;
                _spawnParticle(
                    o.cx + Math.cos(a) * o.r,
                    o.cy + Math.sin(a) * o.r,
                    { color: cfg.color, size: _rnd(1, 4),
                      vx: Math.cos(a) * -0.4, vy: Math.sin(a) * -0.4, life: 300 }
                );
            }

            // Collision : le joueur touche l'anneau (ni dedans ni dehors)
            const distToCenter = Math.hypot(
                state._playerX - o.cx,
                state._playerY - o.cy
            );
            const innerR = Math.max(0, o.r - RING_THICKNESS);
            const outerR = o.r;

            if (distToCenter >= innerR && distToCenter <= outerR + state.PLAYER_RADIUS) {
                return true;
            }

            // Anneau complètement fermé → flash + nettoyage
            if (o.r <= MIN_SIZE) {
                _arenaFlash(cfg.color, 150);
                _spawnParticle(o.cx, o.cy, {
                    color: cfg.accent, size: _rnd(6, 12),
                    vx: 0, vy: 0, life: 400
                });
                o.el.remove();
                o.dotEl.remove();
                state._objects.splice(i, 1);
            }
        }

        return false;
    };
}