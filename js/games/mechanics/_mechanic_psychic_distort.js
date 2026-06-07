import { _rnd } from "../utils.js";
import { _addTimeout, _addInterval, _arenaFlash, _screenShake, _spawnParticle, _hitCircle } from "../game-engine.js";

// ─── 🧠 PSY : zones de lag mental + distorsion visuelle + double fantôme
export function _mechanic_psychic_distort(cfg, difficulty, state) {
    // Fréquence des vagues psy (ms entre chaque activation)
    const psyWaveInterval  = Math.max(2500, 6000 - difficulty * 350);
    // Durée de la vague psy (secondes)
    const psyWaveDuration  = 1.5 + difficulty * 0.35;

    // Lerp speed normal vs dans une zone de lag
    const frictionNormal       = 0.25;
    const frictionInZone       = Math.max(0.020, 0.09 - difficulty * 0.007);
    const frictionWave         = Math.max(0.018, 0.10 - difficulty * 0.008);

    // Projectiles : fréquence de spawn
    const projInterval     = Math.max(250, 800 - difficulty * 60);
    const mirageInterval   = Math.max(150, 600 - difficulty * 55);

    // Vitesse des projectiles
    const projSpeed        = Math.min(3.5, 2 + difficulty * 0.15);

    // Nombre de zones de lag en simultané
    const maxLagZones      = Math.min(4, 1 + Math.floor(difficulty / 3));

    // Durée de vie des zones de lag (ms)
    const lagZoneLife      = Math.max(3000, 8000 - difficulty * 400);

    // Fréquence d'apparition des zones de lag
    const lagZoneInterval  = Math.max(1200, 4500 - difficulty * 330);

    // Probabilité qu'un projectile soit un mirage (inoffensif)
    const mirageProbability = Math.max(0.05, 0.5 - difficulty * 0.045);

    // Rayon des zones de lag
    const lagZoneRadius    =  Math.min(120, 50 + difficulty * 7);


    // ── État interne ───────────────────────────────────────────────────────
    let psyWaveActive      = false;
    let psyWaveTimer       = 0;

    function _setDistortion(active) {
        if (active) {
            state._arena.classList.add("dp-arena--psy-active");
        } else {
            state._arena.classList.remove("dp-arena--psy-active");
            state._arena.style.filter = "";
        }
    }


    // ── Zones de lag ──────────────────────────────────────────────────────
    function spawnLagZone() {
        if (state._isOver) return;

        // Compter les zones actives depuis state._objects plutôt que lagZones
        const activeZones = state._objects.filter(o => o.type === "psy_lag_zone").length;
        if (activeZones >= maxLagZones) return;

        const margin = lagZoneRadius + 10;
        const x = _rnd(margin, state.ARENA_W - margin);
        const y = _rnd(margin, state.ARENA_H - margin);
        const maxLife = lagZoneLife + _rnd(-500, 500);

        const el = document.createElement("div");
        el.style.cssText = `
            position: absolute;
            border-radius: 50%;
            pointer-events: none;
            width:  ${lagZoneRadius * 2}px;
            height: ${lagZoneRadius * 2}px;
            left:   ${x - lagZoneRadius}px;
            top:    ${y - lagZoneRadius}px;
            background: radial-gradient(circle,
                ${cfg.color}28 0%,
                ${cfg.color}10 60%,
                transparent 100%
            );
            border: 1px solid ${cfg.color}44;
            animation: _psyZonePulse 2.2s ease-in-out infinite;
            transition: opacity 0.6s;
        `;

        if (!document.getElementById("_psy-zone-style")) {
            const s = document.createElement("style");
            s.id = "_psy-zone-style";
            s.textContent = `
                @keyframes _psyZonePulse {
                    0%, 100% { opacity: 0.65; transform: scale(1); }
                    50%      { opacity: 1;    transform: scale(1.06); }
                }
            `;
            document.head.appendChild(s);
        }

        state._arena.appendChild(el);

        // ✅ Poussé dans state._objects comme tous les autres objets
        state._objects.push({
            el, x, y,
            r: lagZoneRadius,
            life: maxLife,
            maxLife,
            type: "psy_lag_zone"
        });

        for (let i = 0; i < 10; i++) {
            const angle = (i / 10) * Math.PI * 2;
            _spawnParticle(
                x + Math.cos(angle) * lagZoneRadius * 0.6,
                y + Math.sin(angle) * lagZoneRadius * 0.6,
                {
                    color: cfg.color,
                    size: _rnd(2, 6),
                    vx: Math.cos(angle) * _rnd(0.5, 1.5),
                    vy: Math.sin(angle) * _rnd(0.5, 1.5),
                    life: 700
                }
            );
        }
    }


    // ── Vague psy ─────────────────────────────────────────────────────────
    function triggerPsyWave() {
        if (state._isOver) return;
        psyWaveActive = true;
        psyWaveTimer  = psyWaveDuration;

        _arenaFlash(cfg.color, 400);
        _screenShake(5 + difficulty * 0.5, 500);
        _setDistortion(true);

        // Swirl de particules au centre
        for (let i = 0; i < 20 + difficulty; i++) {
            const angle = (i / (20 + difficulty)) * Math.PI * 2;
            _spawnParticle(
                state.ARENA_W / 2 + Math.cos(angle) * 90,
                state.ARENA_H / 2 + Math.sin(angle) * 70,
                {
                    color: cfg.color,
                    size: _rnd(3, 8),
                    vx: Math.cos(angle + 1.5) * _rnd(1.5, 3.5),
                    vy: Math.sin(angle + 1.5) * _rnd(1.5, 3.5),
                    life: 700
                }
            );
        }
    }

    function endPsyWave() {
        psyWaveActive = false;
        _setDistortion(false);
        _arenaFlash(cfg.accent, 200);
        state._friction = frictionNormal; // Réinitialise pour être sûr
    }


    // ── Projectiles ───────────────────────────────────────────────────────
    function spawnProjectile() {
        if (state._isOver) return;

        const isMirage = Math.random() < mirageProbability;
        const fromEdge = Math.floor(_rnd(0, 4));
        let x, y, vx, vy;
        const speed = projSpeed + _rnd(-0.4, 0.4);

        if      (fromEdge === 0) { x = _rnd(0, state.ARENA_W); y = -14; vx = _rnd(-0.4, 0.4); vy = speed; }
        else if (fromEdge === 1) { x = state.ARENA_W + 14;     y = _rnd(0, state.ARENA_H); vx = -speed; vy = _rnd(-0.4, 0.4); }
        else if (fromEdge === 2) { x = _rnd(0, state.ARENA_W); y = state.ARENA_H + 14; vx = _rnd(-0.4, 0.4); vy = -speed; }
        else                     { x = -14;                     y = _rnd(0, state.ARENA_H); vx = speed; vy = _rnd(-0.4, 0.4); }

        const el = document.createElement("div");
        el.className = "dp-projectile";
        const size = isMirage ? _rnd(10, 18) : _rnd(8, 14);
        el.style.cssText = `
            position: absolute;
            width:  ${size}px;
            height: ${size}px;
            left:   ${x}px;
            top:    ${y}px;
            border-radius: 50%;
            background: ${isMirage ? `${cfg.color}55` : cfg.color};
            box-shadow: 0 0 ${isMirage ? 6 : 10}px ${isMirage ? `${cfg.color}66` : cfg.color};
            pointer-events: none;
            opacity: ${isMirage ? 0.55 : 1};
        `;
        state._arena.appendChild(el);
        state._objects.push({
            el, x, y, vx, vy,
            isMirage,
            phase: _rnd(0, Math.PI * 2),
            type: "psy_proj"
        });
    }


    // ── Intervalles ───────────────────────────────────────────────────────
    _addInterval(triggerPsyWave, psyWaveInterval);
    _addInterval(spawnLagZone,   lagZoneInterval);
    _addInterval(spawnProjectile, projInterval);
    _addInterval(spawnProjectile, mirageInterval);  // flux mirages supplémentaire

    _addTimeout(spawnProjectile, 200);
    _addTimeout(spawnLagZone,    800);

    return function update(now) {
        if (state._isOver) return false;

        const dt = 0.016;

        // --- Gestion vague psy ---
        if (psyWaveActive) {
            psyWaveTimer -= dt;
            if (psyWaveTimer <= 0) endPsyWave();
        }

        // --- Friction : lire les zones depuis state._objects ---
        const inLagZone = state._objects.some(o => {
            if (o.type !== "psy_lag_zone") return false;
            const dx = state._playerX - o.x;
            const dy = state._playerY - o.y;
            return dx * dx + dy * dy < o.r * o.r;
        });

        if (psyWaveActive) {
            state._friction = frictionWave;
        } else if (inLagZone) {
            state._friction = frictionInZone;
        } else {
            state._friction = frictionNormal;
        }

        // --- Tick des zones de lag (dans state._objects) ---
        for (let i = state._objects.length - 1; i >= 0; i--) {
            const o = state._objects[i];
            if (o.type !== "psy_lag_zone") continue;

            o.life -= dt * 1000;

            if (o.life < 1000) {
                o.el.style.opacity = Math.max(0, o.life / 1000);
            }

            if (o.life <= 0) {
                o.el.remove();
                state._objects.splice(i, 1);
            }
        }

        // --- Tick des projectiles --- (inchangé)
        for (let i = state._objects.length - 1; i >= 0; i--) {
            const o = state._objects[i];
            if (o.type !== "psy_proj") continue;

            o.phase += 0.04;
            o.x += o.vx + Math.sin(o.phase) * 1.4;
            o.y += o.vy + Math.cos(o.phase * 0.7) * 0.9;

            o.el.style.left = `${o.x}px`;
            o.el.style.top  = `${o.y}px`;

            if (
                !o.isMirage &&
                _hitCircle(
                    state._playerX, state._playerY, state.PLAYER_RADIUS,
                    o.x, o.y, 7
                )
            ) {
                return true;
            }

            if (
                o.x < -30 || o.x > state.ARENA_W + 30 ||
                o.y < -30 || o.y > state.ARENA_H + 30
            ) {
                o.el.remove();
                state._objects.splice(i, 1);
            }
        }

        return false;
    };
}