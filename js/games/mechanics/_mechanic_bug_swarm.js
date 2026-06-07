import { _rnd, _rndInt } from "../utils.js";
import { _addTimeout, _addInterval, _arenaFlash, _screenShake, _spawnParticle, _hitCircle } from "../game-engine.js";


// ─── 🐛 INSECTE : vagues d'insectes en embuscade, rôdeurs puis attaquants
export function _mechanic_bug_swarm(cfg, difficulty, state) {

    // ── Paramètres scalés difficulty 1–10 ─────────────────────────────────

    // Nombre d'insectes par vague
    const waveSize          = Math.floor(Math.round(3 + difficulty * 0.33));

    // Délai entre chaque vague (ms)
    const waveInterval      = Math.max(1800, 5000 - difficulty * 320);

    // Délai de spawn entre chaque insecte d'une même vague (ms)
    const staggerDelay      = Math.max(80, 250 - difficulty * 15);

    // Durée de la phase "rôdeur" avant attaque (secondes)
    const roamDuration      = Math.max(2, 3.5 - difficulty * 0.15);

    // Durée de vie totale de l'insecte (secondes) — il fade et devient dangereux
    const bugLifetime       = Math.max(4, 9 - difficulty * 0.5);

    // Vitesse de traque pendant la phase attaque
    const huntSpeed         = Math.min(0.1, 0.03 + difficulty * 0.005);

    // Vitesse orbitale pendant la phase rôdeur
    const roamOrbitSpeed    = 0.01;

    // Rayon d'orbite pendant la phase rôdeur
    const roamOrbitRadius   = 200;

    // Seuil d'opacité à partir duquel l'insecte devient dangereux (fade-out)
    const DANGER_OPACITY    = 0.32;


    // ── Spawn d'une vague ──────────────────────────────────────────────────
    function spawnWave() {
        if (state._isOver) return;

        _arenaFlash(cfg.color, 200);

        for (let i = 0; i < waveSize; i++) {
            _addTimeout(() => spawnBug(), i * staggerDelay);
        }
    }

    function spawnBug() {
        if (state._isOver) return;

        // Spawn aléatoire sur l'un des 4 bords
        const edge = _rndInt(0, 3);
        let x, y;
        if      (edge === 0) { x = _rnd(0, state.ARENA_W); y = -12; }
        else if (edge === 1) { x = state.ARENA_W + 12;     y = _rnd(0, state.ARENA_H); }
        else if (edge === 2) { x = _rnd(0, state.ARENA_W); y = state.ARENA_H + 12; }
        else                 { x = -12;                     y = _rnd(0, state.ARENA_H); }

        const el = document.createElement("div");
        el.className = "dp-projectile";
        el.style.cssText = `
            position: absolute;
            width: 11px; height: 9px;
            left: ${x}px; top: ${y}px;
            border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
            background: ${cfg.accent};
            box-shadow: 0 0 7px ${cfg.accent};
            pointer-events: none;
            opacity: 1;
            transition: none;
        `;
        state._arena.appendChild(el);

        // Angle orbital unique par insecte pour désynchroniser les orbites
        const orbitPhase = _rnd(0, Math.PI * 2);

        state._objects.push({
            el, x, y,
            type:       "bug",
            phase:      "roam",          // "roam" | "hunt" | "fading"
            roamTimer:  roamDuration + _rnd(-0.4, 0.4),
            lifetime:   bugLifetime + _rnd(-0.5, 0.5),
            orbitPhase,
            orbitAngle: orbitPhase,
            vx: 0, vy: 0,
            opacity:    1,
            dangerous:  true,            // devient false pendant le fade sauf si > DANGER_OPACITY
        });
    }


    // ── Intervalles ───────────────────────────────────────────────────────
    _addInterval(spawnWave, waveInterval);
    _addTimeout(spawnWave, 600);         // première vague rapide


    // ── Boucle de mise à jour ─────────────────────────────────────────────
    return function update(now) {
        if (state._isOver) return false;

        const dt       = 0.016;
        const t        = now * 0.001;   // secondes, pour l'oscillation

        for (let i = state._objects.length - 1; i >= 0; i--) {
            const o = state._objects[i];
            if (o.type !== "bug") continue;

            // ── Décrémenter timers ─────────────────────────────────────────
            o.roamTimer -= dt;
            o.lifetime  -= dt;

            // ── Machine à états ────────────────────────────────────────────
            if (o.phase === "roam") {

                // Orbite autour du joueur sans trop se rapprocher
                o.orbitAngle += roamOrbitSpeed * (1 + Math.sin(t + o.orbitPhase) * 0.3);
                const targetX = state._playerX + Math.cos(o.orbitAngle) * roamOrbitRadius;
                const targetY = state._playerY + Math.sin(o.orbitAngle) * roamOrbitRadius * 0.75;
                o.x += (targetX - o.x) * 0.07;
                o.y += (targetY - o.y) * 0.07;

                // Transition vers hunt
                if (o.roamTimer <= 0) {
                    o.phase = "hunt";
                    // Petit flash au moment de l'attaque
                    _spawnParticle(o.x, o.y, {
                        color: cfg.color, size: _rnd(10, 15),
                        vx: 0, vy: 0, life: 300
                    });
                    o.el.style.cssText = `
                        position: absolute;
                        width: 11px; height: 9px;
                        left: ${o.x}px; top: ${o.y}px;
                        border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
                        background: ${cfg.color};
                        box-shadow: 0 0 7px ${cfg.color};
                        pointer-events: none;
                        opacity: 1;
                        transition: none;
                    `;
                }

            } else if (o.phase === "hunt") {

                // Fonce vers le joueur
                o.x += (state._playerX - o.x) * huntSpeed;
                o.y += (state._playerY - o.y) * huntSpeed;

                // Passe en fading quand la lifetime est basse
                if (o.lifetime < bugLifetime * 0.45) {
                    o.phase = "fading";
                }

            } else if (o.phase === "fading") {

                // Continue de traquer mais devient de plus en plus invisible
                o.x += (state._playerX - o.x) * huntSpeed * 1.2; // légèrement plus rapide
                o.y += (state._playerY - o.y) * huntSpeed * 1.2;

                // Opacité diminue avec la lifetime restante
                const ratio   = Math.max(0, o.lifetime / (bugLifetime * 0.45));
                o.opacity     = ratio;
                o.el.style.opacity = o.opacity;

                // Dangereux uniquement au-delà du seuil (presque invisible)
                o.dangerous = o.opacity > DANGER_OPACITY;
            }

            // ── Mise à jour position DOM ───────────────────────────────────
            o.el.style.left = `${o.x}px`;
            o.el.style.top  = `${o.y}px`;

            // ── Rotation visuelle pour simuler le vol ─────────────────────
            const angle = Math.atan2(state._playerY - o.y, state._playerX - o.x);
            o.el.style.transform = `rotate(${angle}rad)`;

            // ── Particules de vol (ailes) ──────────────────────────────────
            if (Math.random() < 0.25 && o.opacity > 0.4) {
                _spawnParticle(
                    o.x + _rnd(-4, 4),
                    o.y + _rnd(-3, 3),
                    { color: cfg.accent, size: _rnd(1, 3), vx: _rnd(-0.5, 0.5), vy: _rnd(-0.5, 0.5), life: 150 }
                );
            }

            // ── Collision ─────────────────────────────────────────────────
            // Dangereux en roam/hunt, et en fading seulement si trop transparent
            const isHazardous = o.phase !== "fading" || !o.dangerous;
            if (isHazardous && o.phase === "hunt" && _hitCircle(
                state._playerX, state._playerY, state.PLAYER_RADIUS,
                o.x, o.y, 6
            )) return true;

            // ── Nettoyage ─────────────────────────────────────────────────
            if (o.lifetime <= 0) {
                o.el.remove();
                state._objects.splice(i, 1);
            }
        }

        return false;
    };
}