import { _rnd } from "../utils.js";
import { _addTimeout, _addInterval, _arenaFlash, _screenShake, _hitCircle } from "../game-engine.js";


// ─── 💨 VOL : rafales de vent qui dévient la pokéball
export function _mechanic_flying_gusts(cfg, difficulty, state) {
    const spawnDelay = Math.max(800, 1300 - difficulty * 50);
    const nbProjectile = Math.floor(Math.min(15, 5 + difficulty));
    const projectileSpeed = Math.min(7, 2 + difficulty * 0.5);
    const projectileSize = Math.min(12, 6 + difficulty * 0.5);
    const projetcileDelay = Math.max(50, 150 - difficulty * 10);
    const spreadRange = state.ARENA_W * 0.6;

    const gustForce  = Math.min(7, 3 + difficulty * 0.4);
    
    let gustX = 0, gustY = 0;
    state._friction = 0.12; // contrôle glissant

    function triggerGust() {
        if (state._isOver) return;
        const angle  = Math.random() * Math.PI * 2;
        gustX = Math.cos(angle) * gustForce;
        gustY = Math.sin(angle) * gustForce;
        state._windX = gustX;
        state._windY = gustY;
        _arenaFlash(cfg.color, 300);
        _screenShake(6, 400);

        // Affiche des lignes de vent dans la direction
        for (let i = 0; i < 12; i++) {
        const el = document.createElement("div");
        el.className = "dp-gust";
        const px = _rnd(0, state.ARENA_W);
        const py = _rnd(0, state.ARENA_H);
        const len = _rnd(30, 80);
        el.style.cssText = `
            position:absolute;
            width:${len}px; height:2px;
            left:${px}px; top:${py}px;
            background: linear-gradient(90deg, transparent, ${cfg.color}, transparent);
            transform:rotate(${Math.atan2(gustY, gustX) * 180 / Math.PI}deg);
            transform-origin:left center;
            opacity:0.7; pointer-events:none;
            border-radius:2px;
        `;
        state._arena.appendChild(el);
        _addTimeout(() => el.remove(), _rnd(300, 600));
        }

        // Progressivement le vent s'estompe
        let fade = 0;
        const fadeInterval = setInterval(() => {
        fade++;
        state._windX *= 0.9;
        state._windY *= 0.9;
        if (fade > 30) clearInterval(fadeInterval);
        }, 50);
        state._intervals.push(fadeInterval);

        // Projectiles en rafale
        for (let i = 0; i < nbProjectile; i++) {
            _addTimeout(() => {
                if (state._isOver) return;
                const perpX = -Math.sin(angle); // vecteur perpendiculaire
                const perpY =  Math.cos(angle);
                const spread = _rnd(-spreadRange / 2, spreadRange / 2);

                // Point de spawn sur le bord opposé à la direction du vent
                // On part du centre de l'arène et on recule dans la direction opposée
                // jusqu'à toucher un bord
                const originX = state.ARENA_W / 2 - Math.cos(angle) * state.ARENA_W;
                const originY = state.ARENA_H / 2 - Math.sin(angle) * state.ARENA_H;

                // On clamp sur les bords réels
                const sx = Math.max(-20, Math.min(state.ARENA_W + 20, originX + perpX * spread));
                const sy = Math.max(-20, Math.min(state.ARENA_H + 20, originY + perpY * spread));

                // Légère variation d'angle par plume pour l'aspect organique
                const spawnAngle = angle + _rnd(-0.15, 0.15);

                const w = _rnd(6, projectileSize);
                const h = w * _rnd(2.5, 3.5); // allongé comme une plume

                const el2 = document.createElement("div");
                el2.className = "dp-projectile";
                el2.style.cssText = `
                    position: absolute;
                    width:  ${w}px;
                    height: ${h}px;
                    left:   ${sx}px;
                    top:    ${sy}px;
                    background: linear-gradient(180deg, ${cfg.accent} 0%, ${cfg.color} 50%, transparent 100%);
                    border-radius: 50% 50% 40% 40% / 60% 60% 40% 40%;
                    transform: translate(-50%, -50%) rotate(${spawnAngle * 180 / Math.PI + 90}deg);
                    box-shadow: 0 0 5px ${cfg.color}88;
                    pointer-events: none;
                    opacity: 0.85;
                `;
                state._arena.appendChild(el2);
                state._objects.push({
                    el:   el2,
                    x: sx, y: sy,
                    vx: Math.cos(spawnAngle) * projectileSpeed,
                    vy: Math.sin(spawnAngle) * projectileSpeed,
                    type: "gust_projectile"
                });
            }, i * projetcileDelay);
        }
    }


    _addInterval(triggerGust, spawnDelay);

    return function update() {
        // Appliquer le vent sur le joueur
        state._playerX += state._windX * 0.4;
        state._playerY += state._windY * 0.4;

        for (let i = state._objects.length - 1; i >= 0; i--) {
        const o = state._objects[i];
        if (o.type !== "gust_projectile") continue;
        o.x += o.vx; o.y += o.vy;
        o.el.style.left = `${o.x}px`;
        o.el.style.top  = `${o.y}px`;

        if (_hitCircle(state._playerX, state._playerY, state.PLAYER_RADIUS, o.x, o.y, 10)) return true;
        if (o.x < -50 || o.x > state.ARENA_W + 50 || o.y < -50 || o.y > state.ARENA_H + 50) {
            o.el.remove(); state._objects.splice(i, 1);
        }
        }
        return false;
    };
}