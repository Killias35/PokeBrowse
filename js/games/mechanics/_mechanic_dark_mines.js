import { _rnd } from "../utils.js";
import { _addTimeout, _addInterval, _arenaFlash, _screenShake, _spawnParticle, _hitCircle } from "../game-engine.js";


// ─── 🌑 TÉNÈBRES : clone obscur + fausses zones
export function _mechanic_dark_mines(cfg, difficulty, state) {

    // ── Paramètres ────────────────────────────────────────────────────────

    // Délai avant apparition du clone
    let cloneSpawnDelay   = 100;

    // Délai avec lequel le clone suit le joueur (secondes de retard)
    const cloneDelay        = Math.max(0.3, 1 - difficulty * 0.07);

    // Rayon de danger autour du clone
    const cloneRadius       = Math.max(20, 40 - difficulty * 2);

    // Vitesse de lerp du clone vers sa cible (position retardée)
    const cloneLerp         = Math.min(0.1, 0.04 + difficulty * 0.006);

    // Fréquence des fausses zones / vraies zones
    const zoneInterval      = Math.max(200, 1000 - difficulty * 80);

    // Probabilité qu'une zone soit un leurre
    const decoyRate         = Math.max(0.2, 0.7 - difficulty * 0.05);

    // Durée de vie des zones (ms)
    const zoneLifetime      = Math.max(2500, 4500 - difficulty * 200);

    // Délai avant explosion des vraies zones (ms)
    const blastDelay        = Math.max(800, 2000 - difficulty * 120);

    // Intensité du flash au moment où le clone "pulse"
    const pulseInterval     = Math.max(1200, 3000 - difficulty * 180);


    // ── Historique de position pour le délai du clone ─────────────────────
    // On stocke les positions passées du joueur pour les rejouer avec retard
    const posHistory        = [];
    const historyLength     = Math.round(cloneDelay * 60); // frames


    // ── Création du clone ─────────────────────────────────────────────────
    const cloneEl = document.createElement("div");
    cloneEl.style.cssText = `
        position: absolute;
        width:  ${cloneRadius * 2}px;
        height: ${cloneRadius * 2}px;
        left:   ${state.ARENA_W / 2}px;
        top:    ${state.ARENA_H / 2}px;
        transform: translate(-50%, -50%);
        border-radius: 50%;
        background: radial-gradient(circle at 40% 35%,
            ${cfg.color}55 0%,
            ${cfg.color}22 50%,
            transparent 75%
        );
        border: 1px solid ${cfg.color}88;
        box-shadow: 0 0 20px ${cfg.color}66, inset 0 0 12px ${cfg.color}33;
        pointer-events: none;
        z-index: 7;
        transition: opacity 0.3s;
    `;

    // Yeux du clone
    cloneEl.innerHTML = `
        <div style="
            position:absolute; top:38%; left:28%;
            width:6px; height:6px; border-radius:50%;
            background:${cfg.accent}; box-shadow:0 0 6px ${cfg.accent};
            opacity:0.9;
        "></div>
        <div style="
            position:absolute; top:38%; right:28%;
            width:6px; height:6px; border-radius:50%;
            background:${cfg.accent}; box-shadow:0 0 6px ${cfg.accent};
            opacity:0.9;
        "></div>
    `;

    state._arena.appendChild(cloneEl);
    state._objects.push({ el: cloneEl, type: "dark_clone_visual" });

    let cloneX = state.ARENA_W / 2;
    let cloneY = state.ARENA_H / 2;


    // ── Pulse du clone (rappel visuel de danger) ───────────────────────────
    function pulseClone() {
        if (state._isOver) return;
        cloneEl.style.boxShadow = `0 0 40px ${cfg.color}, 0 0 70px ${cfg.color}88`;
        _arenaFlash(cfg.color, 250);
        _screenShake(3 + difficulty * 0.3, 300);
        setTimeout(() => {
            cloneEl.style.boxShadow = `0 0 20px ${cfg.color}66, inset 0 0 12px ${cfg.color}33`;
        }, 300);
    }
    _addInterval(pulseClone, pulseInterval);


    // ── Zones (vraies et leurres) ─────────────────────────────────────────
    function spawnZone() {
        if (state._isOver) return;

        const isDecoy   = Math.random() < decoyRate;
        const x         = _rnd(50, state.ARENA_W - 50);
        const y         = _rnd(50, state.ARENA_H - 50);
        const size      = _rnd(44, 80);
        const lifetime  = zoneLifetime + _rnd(-400, 400);

        const el = document.createElement("div");
        el.style.cssText = `
            position: absolute;
            width:  ${size}px; height: ${size}px;
            left:   ${x}px;   top:    ${y}px;
            transform: translate(-50%, -50%);
            border-radius: 50%;
            border: 2px solid ${cfg.accent}${isDecoy ? "44" : "88"};
            background: radial-gradient(circle,
                ${cfg.accent}${isDecoy ? "08" : "18"} 0%,
                transparent 70%
            );
            box-shadow: 0 0 ${isDecoy ? 6 : 14}px ${cfg.accent}${isDecoy ? "22" : "55"};
            pointer-events: none;
            z-index: 6;
            opacity: 0;
            transition: opacity 0.4s;
        `;
        state._arena.appendChild(el);
        requestAnimationFrame(() => { el.style.opacity = "1"; });

        const obj = {
            el, x, y,
            r:          size / 2,
            type:       "dark_zone",
            isDecoy,
            lifetime,
            maxLifetime: lifetime,
            exploding:  false,
        };
        state._objects.push(obj);

        // Les vraies zones explosent après blastDelay
        if (!isDecoy) {
            _addTimeout(() => {
                if (state._isOver || obj.exploding) return;
                obj.exploding   = true;
                obj.r           = (size * 2.2) / 2;

                el.style.transition = `all 350ms ease-out`;
                el.style.width      = `${size * 2.2}px`;
                el.style.height     = `${size * 2.2}px`;
                el.style.background = `radial-gradient(circle, ${cfg.accent}, ${cfg.color}88, transparent 70%)`;
                el.style.border     = "none";
                el.style.boxShadow  = `0 0 50px ${cfg.accent}, 0 0 80px ${cfg.color}`;

                _arenaFlash(cfg.color, 180);

                for (let i = 0; i < 10; i++) {
                    const a = (i / 10) * Math.PI * 2;
                    _spawnParticle(x, y, {
                        color: cfg.accent, size: _rnd(3, 8),
                        vx: Math.cos(a) * _rnd(1.5, 3.5),
                        vy: Math.sin(a) * _rnd(1.5, 3.5),
                        life: 400
                    });
                }

                _addTimeout(() => {
                    obj.exploding = false;
                    el.style.transition = "opacity 0.3s";
                    el.style.opacity    = "0";
                    _addTimeout(() => {
                        el.remove();
                        const idx = state._objects.indexOf(obj);
                        if (idx > -1) state._objects.splice(idx, 1);
                    }, 300);
                }, 350);
            }, blastDelay);
        }
    }

    _addInterval(spawnZone, zoneInterval);
    _addTimeout(spawnZone, 500);


    // ── Update ────────────────────────────────────────────────────────────
    return function update() {
        if (state._isOver) return false;

        // Enregistre la position courante du joueur
        posHistory.push({ x: state._playerX, y: state._playerY });
        if (posHistory.length > historyLength) posHistory.shift();

        if (cloneSpawnDelay > 0) {
            cloneSpawnDelay--;
        }
        else {
            // Le clone vise la position retardée (début du buffer)
            const target = posHistory.length >= historyLength
                ? posHistory[0]
                : { x: state.ARENA_W / 2, y: state.ARENA_H / 2 };

            cloneX += (target.x - cloneX) * cloneLerp;
            cloneY += (target.y - cloneY) * cloneLerp;

            cloneEl.style.left = `${cloneX}px`;
            cloneEl.style.top  = `${cloneY}px`;

            // Particules de traînée du clone
            if (Math.random() < 0.15) {
                _spawnParticle(cloneX + _rnd(-8, 8), cloneY + _rnd(-8, 8), {
                    color: cfg.color, size: _rnd(2, 5),
                    vx: _rnd(-0.3, 0.3), vy: _rnd(-0.3, 0.3), life: 350
                });
            }
        }

        // Collision clone
        if (_hitCircle(
            state._playerX, state._playerY, state.PLAYER_RADIUS,
            cloneX, cloneY, cloneRadius
        ) && cloneSpawnDelay <= 0) return true;

        // Collision zones
        for (let i = state._objects.length - 1; i >= 0; i--) {
            const o = state._objects[i];
            if (o.type !== "dark_zone") continue;

            // Fade out naturel sur la durée de vie (leurres seulement — les vraies explosent)
            if (o.isDecoy) {
                o.lifetime -= 16;
                if (o.lifetime < 600) {
                    o.el.style.opacity = Math.max(0, o.lifetime / 600);
                }
                if (o.lifetime <= 0) {
                    o.el.remove();
                    state._objects.splice(i, 1);
                    continue;
                }
            }

            // Collision uniquement sur les vraies zones en explosion
            if (!o.isDecoy && o.exploding && _hitCircle(
                state._playerX, state._playerY, state.PLAYER_RADIUS,
                o.x, o.y, o.r
            )) return true;
        }

        return false;
    };
}