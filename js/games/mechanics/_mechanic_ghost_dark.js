import { _rnd } from "../utils.js";
import { _addTimeout, _addInterval, _arenaFlash, _spawnParticle, _hitCircle } from "../game-engine.js";


// ─── 👻 SPECTRE : obscurité, fantômes trompeurs et traversées
export function _mechanic_ghost_dark(cfg, difficulty, state) {
    // Rayon de visibilité autour du joueur (px) — rétrécit avec la difficulté
    const visionRadius      = Math.max(55, 160 - difficulty * 11);

    // Fréquence de spawn des fantômes flottants
    const floatInterval     = Math.max(800, 2000 - difficulty * 120);

    // Fréquence des traversées rapides
    const dashInterval      = Math.max(1500, 5000 - difficulty * 350);

    // Vitesse de dérive des fantômes flottants vers le joueur
    const floatDrift        = Math.min(0.025, 0.01 + difficulty * 0.0015);

    // Vitesse des fantômes en traversée
    const dashSpeed         = Math.min(5, 3 + difficulty * 0.2);

    // Probabilité qu'un fantôme flottant soit un leurre (inoffensif)
    const deceptRate        = Math.max(0.15, 0.65 - difficulty * 0.05);

    // Durée de vie des fantômes flottants (ms)
    const floatLifetime     = Math.max(2500, 5000 - difficulty * 250);

    // Délai avant qu'un fantôme en traversée devienne visible (ms)
    const dashRevealDelay   = 100;


    // ── Overlay d'obscurité ───────────────────────────────────────────────
    const darkOverlay = document.createElement("div");
    darkOverlay.style.cssText = `
        position: absolute; inset: 0;
        pointer-events: none;
        z-index: 5;
        background: radial-gradient(
            circle ${visionRadius}px at 50% 50%,
            transparent 40%,
            rgba(8, 5, 20, 0.96) 100%
        );
    `;
    state._arena.appendChild(darkOverlay);
    state._objects.push({ el: darkOverlay, type: "ghost_overlay" });


    // ── Fantôme flottant ──────────────────────────────────────────────────
    function spawnFloatingGhost() {
        if (state._isOver) return;

        const isDecoy   = Math.random() < deceptRate;

        // Spawn sur un bord aléatoire
        const edge      = Math.floor(_rnd(0, 4));
        let x, y;
        if      (edge === 0) { x = _rnd(20, state.ARENA_W - 20); y = -20; }
        else if (edge === 1) { x = state.ARENA_W + 20; y = _rnd(20, state.ARENA_H - 20); }
        else if (edge === 2) { x = _rnd(20, state.ARENA_W - 20); y = state.ARENA_H + 20; }
        else                 { x = -20; y = _rnd(20, state.ARENA_H - 20); }

        const size      = _rnd(36, 68);
        const lifetime  = floatLifetime + _rnd(-600, 600);

        const el        = document.createElement("div");
        el.style.cssText = `
            position: absolute;
            width:  ${size}px;
            height: ${size}px;
            left:   ${x}px; top: ${y}px;
            transform: translate(-50%, -50%);
            border-radius: 50% 50% 45% 45% / 55% 55% 45% 45%;
            background: radial-gradient(circle at 40% 35%,
                ${isDecoy ? cfg.accent : cfg.color}22 0%,
                ${isDecoy ? cfg.accent : cfg.color}08 60%,
                transparent 100%
            );
            border: 1px solid ${isDecoy ? cfg.accent : cfg.color}${isDecoy ? "44" : "66"};
            box-shadow: 0 0 14px ${isDecoy ? cfg.accent : cfg.color}${isDecoy ? "33" : "55"};
            pointer-events: none;
            z-index: 6;
            opacity: 0;
            transition: opacity 0.5s;
        `;
        state._arena.appendChild(el);

        // Fade in
        requestAnimationFrame(() => { el.style.opacity = "0.08"; });  // quasi invisible au spawn

        // Yeux — légèrement différents entre leurre et vrai
        const eyeColor  = isDecoy ? cfg.accent : "#fff";
        const eyeOpacity = isDecoy ? "0.3" : "0.7";
        el.innerHTML    = `
            <div style="position:absolute;top:35%;left:25%;
                        width:${size * 0.14}px;height:${size * 0.14}px;
                        border-radius:50%;background:${eyeColor};
                        opacity:${eyeOpacity};box-shadow:0 0 4px ${eyeColor}"></div>
            <div style="position:absolute;top:35%;right:25%;
                        width:${size * 0.14}px;height:${size * 0.14}px;
                        border-radius:50%;background:${eyeColor};
                        opacity:${eyeOpacity};box-shadow:0 0 4px ${eyeColor}"></div>
        `;

        state._objects.push({
            el, x, y,
            type:       "ghost_float",
            isDecoy,
            r:          size / 2,
            lifetime,
            maxLifetime: lifetime,
            phase:      _rnd(0, Math.PI * 2),   // oscillation désynchronisée
            opacity: isDecoy ? 0.55 : 0.7
        });
    }


    // ── Fantôme en traversée rapide ────────────────────────────────────────
    function spawnDashGhost() {
        if (state._isOver) return;
        const fromLeft = Math.random() < 0.5;
        const x        = fromLeft ? -18 : state.ARENA_W + 18;

        // Spawn sur une hauteur aléatoire
        const y        = _rnd(20, state.ARENA_H - 20);
        const vx       = (fromLeft ? 1 : -1) * dashSpeed;

        // Angle vers le joueur calculé UNE SEULE FOIS au spawn, pas de suivi
        // Limité pour ne pas faire une diagonale trop franche
        const rawVy    = (state._playerY - y) / state.ARENA_W * dashSpeed * 2.5;
        const vy       = Math.max(-dashSpeed * 0.45, Math.min(dashSpeed * 0.45, rawVy));


        const el        = document.createElement("div");
        el.style.cssText = `
            position: absolute;
            width:  30px; height: 24px;
            left:   ${x}px; top: ${y}px;
            transform: translate(-50%, -50%) scaleX(${fromLeft ? 1 : -1});
            border-radius: 50% 50% 40% 40% / 60% 60% 40% 40%;
            background: radial-gradient(circle at 40% 30%,
                ${cfg.color}18 0%, transparent 70%
            );
            border: 1px solid ${cfg.color}33;
            pointer-events: none;
            z-index: 6;
            opacity: 0;
            transition: opacity 0.25s;
        `;
        state._arena.appendChild(el);

        // Invisible au départ, révélé après dashRevealDelay
        _addTimeout(() => {
            if (!el.isConnected) return;
            el.style.opacity = "0.9";
        }, dashRevealDelay);

        state._objects.push({
            el, x, y, vx, vy,
            type:   "ghost_dash",
            r:      14,
            fromLeft,
        });

        _arenaFlash(cfg.color, 180);
    }


    // ── Intervalles ───────────────────────────────────────────────────────
    _addInterval(spawnFloatingGhost, floatInterval);
    _addInterval(spawnDashGhost,     dashInterval);

    _addTimeout(spawnFloatingGhost,  300);
    _addTimeout(spawnFloatingGhost,  800);
    _addTimeout(spawnDashGhost,      2200);


    // ── Boucle de mise à jour ─────────────────────────────────────────────
    return function update(now) {
        if (state._isOver) return false;

        const dt = 0.016;
        const t  = now * 0.001;

        // --- Overlay : repositionner en JS pour éviter les bugs de custom props ---
        darkOverlay.style.background = `radial-gradient(
            circle ${visionRadius}px at ${state._playerX}px ${state._playerY}px,
            transparent 40%,
            rgba(8, 5, 20, 0.96) 100%
        )`;

        for (let i = state._objects.length - 1; i >= 0; i--) {
            const o = state._objects[i];

            // ── Fantômes flottants ─────────────────────────────────────────
            if (o.type === "ghost_float") {

                o.lifetime -= dt * 1000;

                // Dérive douce + oscillation (inchangé)
                o.x += (state._playerX - o.x) * floatDrift;
                o.y += (state._playerY - o.y) * floatDrift;
                o.x += Math.sin(t * 1.3 + o.phase) * 0.6;
                o.y += Math.cos(t * 0.9 + o.phase) * 0.4;

                o.el.style.left = `${o.x}px`;
                o.el.style.top  = `${o.y}px`;

                // Opacité basée sur la distance au joueur
                const dx       = state._playerX - o.x;
                const dy       = state._playerY - o.y;
                const dist     = Math.sqrt(dx * dx + dy * dy);
                const revealAt = visionRadius * 1.4;    // commence à apparaître à 140% du rayon de vision
                const fullAt   = visionRadius * 0.5;    // pleinement visible à 50% du rayon
                const proximity = 1 - Math.min(1, Math.max(0, (dist - fullAt) / (revealAt - fullAt)));
                const baseOpacity = proximity * o.opacity;  // o.opacity = max selon type (decoy ou non)

                // Pulsation légère
                const pulse = 0.06 * Math.sin(t * 2.5 + o.phase);

                // Fade out sur la dernière seconde
                const fadeMult = o.lifetime < 1000 ? o.lifetime / 1000 : 1;

                o.el.style.opacity = Math.max(0, (baseOpacity + pulse) * fadeMult);

                // Collision uniquement sur les vrais fantômes
                if (!o.isDecoy && _hitCircle(
                    state._playerX, state._playerY, state.PLAYER_RADIUS,
                    o.x, o.y, o.r * 0.6     // hitbox plus petite que le visuel = fair play
                )) return true;

                // Particules de traînée spectrale occasionnelles
                _spawnParticle(
                    o.x + _rnd(-o.r * 0.4, o.r * 0.4),
                    o.y + _rnd(-o.r * 0.4, o.r * 0.4),
                    { color: cfg.color, size: _rnd(1, 3), vx: _rnd(-0.3, 0.3), vy: _rnd(-0.3, 0.3), life: 400 }
                );

                if (o.lifetime <= 0) {
                    o.el.remove();
                    state._objects.splice(i, 1);
                }
            }

            // ── Fantômes en traversée ──────────────────────────────────────
            else if (o.type === "ghost_dash") {
                o.x += o.vx;
                o.y += o.vy; 

                o.el.style.left = `${o.x}px`;
                o.el.style.top  = `${o.y}px`;

                if (_hitCircle(
                    state._playerX, state._playerY, state.PLAYER_RADIUS,
                    o.x, o.y, o.r
                )) return true;

                // Nettoyage hors arène
                const out = o.fromLeft
                    ? o.x > state.ARENA_W + 30
                    : o.x < -30;
                if (out) {
                    o.el.remove();
                    state._objects.splice(i, 1);
                }
            }
        }

        return false;
    };
}