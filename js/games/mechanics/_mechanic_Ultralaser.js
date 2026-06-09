import { _rnd, _rndInt } from "../utils.js";
import { _addInterval, _addTimeout, _spawnParticle, _arenaFlash, _screenShake, _burstParticles } from "../game-engine.js";


// ─── ⚡ NORMAL : Ultralaser — rayon dévastateur avec sweep
export function _mechanic_Ultralaser(cfg, difficulty, state) {

    // ── Paramètres ────────────────────────────────────────────────────────

    // Durée de la phase de charge (frames)
    const CHARGE_DURATION   = Math.max(45, 70 - difficulty * 2.5);

    // Durée du beam actif (frames)
    const BEAM_DURATION     = Math.min(40, 20 + difficulty * 2);

    // Hauteur du beam (épaisseur)
    const BEAM_HEIGHT       = Math.min(90, 30 + difficulty * 6);

    // Vitesse de rotation du sweep (rad/frame) — 0 à diff basse
    const SWEEP_SPEED       = Math.min(0.02, difficulty * 0.002);

    // Intervalle entre chaque laser (ms)
    const SPAWN_INTERVAL    = Math.max(900, 1600 - difficulty * 70);

    // Nombre de lasers simultanés à diff haute
    const MAX_BEAMS         = 2;
    const IMPRECISION       = Math.max(20, 60 - difficulty * 4);


    // ── Spawn d'un Ultralaser ─────────────────────────────────────────────
    function spawnUltralaser() {
        if (state._isOver) return;

        const active = state._objects.filter(o => o.type === "ultralaser").length;
        if (active >= MAX_BEAMS) return;

        const side  = _rndInt(0, 3);
        let sx, sy, tx, ty;
        switch (side) {
            case 0: sx = _rnd(60, state.ARENA_W - 60); sy = -50; tx = _rnd(60, state.ARENA_W - 60); ty = state.ARENA_H + 50;                break;
            case 1: sx = _rnd(60, state.ARENA_W - 60); sy = state.ARENA_H + 50; tx = _rnd(60, state.ARENA_W - 60); ty = -50;                break;
            case 2: sx = -50; sy = _rnd(60, state.ARENA_H - 60); tx = state.ARENA_W + 50; ty = _rnd(60, state.ARENA_H - 60);             break;
            default: sx = state.ARENA_W + 50; sy = _rnd(60, state.ARENA_H - 60); tx = -50; ty = _rnd(60, state.ARENA_H - 60); break;
        }

        const dx    = tx - sx, dy = ty - sy;
        let angle   = Math.atan2(dy, dx);
        const length = Math.hypot(state.ARENA_W, state.ARENA_H) * 1.5;
        const sweepDir = Math.random() < 0.5 ? 1 : -1;

        // ── Télégraphe ────────────────────────────────────────────────────
        const telegraph = document.createElement("div");
        telegraph.style.cssText = `
            position: absolute;
            left: ${sx}px; top: ${sy}px;
            width: ${length}px; height: 3px;
            transform-origin: left center;
            transform: rotate(${angle}rad);
            background: linear-gradient(90deg, ${cfg.color}cc, transparent);
            opacity: 0;
            pointer-events: none;
            z-index: 5;
            transition: opacity 0.15s;
        `;
        state._arena.appendChild(telegraph);
        state._objects.push({ type: "telegraph", el: telegraph });
        requestAnimationFrame(() => { telegraph.style.opacity = "1"; });

        // ── Anneau de charge autour de la source ──────────────────────────
        const chargeRing = document.createElement("div");
        chargeRing.style.cssText = `
            position: absolute;
            left: ${sx}px; top: ${sy}px;
            width: 0px; height: 0px;
            border-radius: 50%;
            border: 3px solid ${cfg.color};
            box-shadow: 0 0 20px ${cfg.color}, 0 0 40px ${cfg.accent};
            transform: translate(-50%, -50%);
            pointer-events: none;
            z-index: 6;
            transition: width 0.05s, height 0.05s;
        `;
        state._arena.appendChild(chargeRing);
        state._objects.push({ type: "chargeRing", el: chargeRing });

        
        // ── Flèche directionnelle (ajout dans spawnUltralaser, après chargeRing) ──

        const arrowEl = document.createElement("div");
        const arcRadius = 28;
        const startAngle = angle;
        const endAngle   = angle + SWEEP_SPEED * sweepDir * BEAM_DURATION;

        // Coordonnées de l'arc sur un cercle de rayon arcRadius
        const ax1 = 50 + Math.cos(startAngle) * arcRadius;
        const ay1 = 50 + Math.sin(startAngle) * arcRadius;
        const ax2 = 50 + Math.cos(endAngle)   * arcRadius;
        const ay2 = 50 + Math.sin(endAngle)   * arcRadius;

        // largeArc = 1 si l'angle balayé dépasse π
        const sweep     = Math.abs(endAngle - startAngle);
        const largeArc  = sweep > Math.PI ? 1 : 0;
        const sweepFlag = sweepDir > 0 ? 1 : 0;
        const indicatorDist = 80;
        const rawX = sx + Math.cos(angle) * indicatorDist;
        const rawY = sy + Math.sin(angle) * indicatorDist;
        const arrowColor = cfg.accent
        
        // Clamp du point central dans l'arène avec marge
        const margin  = 55;
        const centerX = Math.max(margin, Math.min(state.ARENA_W - margin, rawX));
        const centerY = Math.max(margin, Math.min(state.ARENA_H - margin, rawY));

        const left = centerX - 50;
        const top  = centerY - 50;

        arrowEl.style.cssText = `
            position: absolute;
            left: ${left}px;
            top:  ${top}px;
            width: 100px; height: 100px;
            transform-origin: 50px 50px;
            pointer-events: none;
            z-index: 8;
            opacity: 0;
            transition: opacity 0.2s;
        `;
        arrowEl.innerHTML = `
            <svg width="100" height="100" viewBox="0 0 100 100"
                xmlns="http://www.w3.org/2000/svg"
                style="overflow:visible;">

                <!-- Ligne de départ (direction actuelle du beam) -->
                <line x1="50" y1="50"
                    x2="${50 + Math.cos(startAngle) * arcRadius}"
                    y2="${50 + Math.sin(startAngle) * arcRadius}"
                    stroke="${arrowColor}66" stroke-width="1.5"
                    stroke-dasharray="3 3" stroke-linecap="round"/>

                <!-- Arc du sweep -->
                <path d="M ${ax1} ${ay1} A ${arcRadius} ${arcRadius} 0 ${largeArc} ${sweepFlag} ${ax2} ${ay2}"
                    stroke="${arrowColor}" stroke-width="2.5"
                    fill="none" stroke-linecap="round"
                    filter="drop-shadow(0 0 4px ${arrowColor})"/>

                <!-- Pointe de flèche à la destination finale -->
                <g transform="translate(${ax2}, ${ay2}) rotate(${endAngle * 180 / Math.PI + 90})">
                    <polygon points="0,-7 5,3 -5,3"
                            fill="${arrowColor}"/>
                    <polygon points="0,-7 5,3 -5,3"
                            fill="${arrowColor}" opacity="0.6"/>
                </g>

                <!-- Point de départ -->
                <circle cx="${ax1}" cy="${ay1}" r="3"
                        fill="${arrowColor}" opacity="0.5"/>
            </svg>
        `;
        state._arena.appendChild(arrowEl);
        state._objects.push({ type: "arrow", el: arrowEl });
        requestAnimationFrame(() => { arrowEl.style.opacity = "1"; });

        const obj = {
            type:       "ultralaser",
            sx, sy, angle,
            length,
            charge:     CHARGE_DURATION,
            active:     false,
            beam:       null,
            beamCore:   null,
            telegraph,
            chargeRing,
            life:       BEAM_DURATION,
            sweepDir,
            arrowEl,
        };
        state._objects.push(obj);
    }


    // ── Activation du beam ────────────────────────────────────────────────
    function fireBeam(o) {

        o.telegraph.remove();
        o.chargeRing.remove();

        // Flash + shake très intenses — c'est le point fort vs Hydrocanon
        o.arrowEl.style.transition = "opacity 0.06s, transform 0.06s";
        o.arrowEl.style.transform  += " scale(2.5)";
        o.arrowEl.style.opacity    = "0";
        //_addTimeout(() => o.arrowEl.remove(), 120);
        _arenaFlash(cfg.color, 80);
        _screenShake(20, 400);
        _burstParticles(o.sx, o.sy, 40, cfg.color, cfg.accent);

        // Deuxième flash légèrement décalé pour l'effet "double impact"
        _addTimeout(() => _arenaFlash(cfg.accent, 120), 80);

        // Beam extérieur (glow large)
        const beam = document.createElement("div");
        beam.style.cssText = `
            position: absolute;
            left: ${o.sx}px;
            top:  ${o.sy}px;
            width:  ${o.length}px;
            height: ${o.beamH = BEAM_HEIGHT}px;
            transform-origin: left center;
            transform: translateY(-50%) rotate(${o.angle}rad);
            border-radius: 0 50px 50px 0;
            background: linear-gradient(90deg,
                ${cfg.color},
                ${cfg.accent} 30%,
                white 55%,
                ${cfg.accent} 75%,
                transparent
            );
            box-shadow:
                0 0 20px 8px ${cfg.color},
                0 0 50px 15px ${cfg.accent}88,
                0 0 90px 20px ${cfg.color}44;
            pointer-events: none;
            z-index: 6;
            opacity: 0;
            transition: opacity 0.04s;
        `;
        state._arena.appendChild(beam);
        state._objects.push({ type: "beam", el: beam });
        requestAnimationFrame(() => { beam.style.opacity = "1"; });

        // Cœur blanc aveuglant (plus fin, au centre du beam)
        const beamCore = document.createElement("div");
        beamCore.style.cssText = `
            position: absolute;
            left: ${o.sx}px;
            top:  ${o.sy}px;
            width:  ${o.length}px;
            height: ${BEAM_HEIGHT * 0.25}px;
            transform-origin: left center;
            transform: translateY(-50%) rotate(${o.angle}rad);
            border-radius: 0 50px 50px 0;
            background: linear-gradient(90deg, white, white 60%, transparent);
            box-shadow: 0 0 15px 5px white;
            pointer-events: none;
            z-index: 7;
        `;
        state._arena.appendChild(beamCore);
        state._objects.push({ type: "beamCore", el: beamCore });

        o.beam     = beam;
        o.beamCore = beamCore;
        o.active   = true;
    }


    // ── Mise à jour de la rotation du beam DOM ────────────────────────────
    function updateBeamTransform(o) {
        const transform = `translateY(-50%) rotate(${o.angle}rad)`;
        o.beam.style.transform     = transform;
        o.beamCore.style.transform = transform;
    }


    // ── Intervalles ───────────────────────────────────────────────────────
    _addInterval(spawnUltralaser, SPAWN_INTERVAL);
    _addTimeout(spawnUltralaser, 300);


    // ── Update ────────────────────────────────────────────────────────────
    return function update() {
        if (state._isOver) return false;

        for (let i = state._objects.length - 1; i >= 0; i--) {
            const o = state._objects[i];
            if (o.type !== "ultralaser") continue;


            // ── Phase de charge ───────────────────────────────────────────
            if (!o.active) {
                o.charge--;

                const progress = 1 - o.charge / CHARGE_DURATION;

                // Télégraphe de plus en plus visible
                o.telegraph.style.opacity = 0.15 + progress * 0.7;

                // Hauteur du télégraphe grandit avec la charge
                o.telegraph.style.height  = `${2 + progress * 6}px`;

                // Anneau de charge qui grandit
                const ringSize = progress * (40 + difficulty * 5);
                o.chargeRing.style.width  = `${ringSize}px`;
                o.chargeRing.style.height = `${ringSize}px`;
                o.chargeRing.style.opacity = progress;
                o.chargeRing.style.boxShadow = `
                    0 0 ${10 + progress * 30}px ${cfg.color},
                    0 0 ${20 + progress * 50}px ${cfg.accent}
                `;

                // Arc entre angle initial et final — la flèche pointe vers la destination du sweep
                const arrowScale = 0.6 + progress * 0.8;
                const arrowPulse = 1 + 0.12 * Math.sin(Date.now() * 0.015);

                o.arrowEl.style.transform = `scale(${arrowScale * arrowPulse})`;
                o.arrowEl.style.opacity   = 0.4 + progress * 0.6;

                // Particules qui convergent depuis toute l'arène vers la source
                const particleCount = Math.floor(2 + progress * 8);
                for (let p = 0; p < particleCount; p++) {
                    const px = _rnd(0, state.ARENA_W);
                    const py = _rnd(0, state.ARENA_H);
                    const vx = (o.sx - px) * (0.04 + progress * 0.06);
                    const vy = (o.sy - py) * (0.04 + progress * 0.06);
                    _spawnParticle(px, py, {
                        color: Math.random() < 0.6 ? cfg.color : cfg.accent,
                        size:  _rnd(2, 5 + progress * 4),
                        vx, vy,
                        life:  150 + progress * 200
                    });
                }

                if (o.charge <= 0) fireBeam(o);
                continue;
            }


            // ── Phase active ──────────────────────────────────────────────
            o.life--;

            // Sweep : rotation lente pendant le tir
            if (SWEEP_SPEED > 0) {
                o.angle += SWEEP_SPEED * o.sweepDir;
                updateBeamTransform(o);

                // Met aussi à jour la position du télégraphe si encore visible
                // (déjà retiré, mais le sweep continue sans lui)
            }

            // Particules le long du beam (spray intense)
            const sprayCount = 6 + Math.floor(difficulty * 0.8);
            for (let p = 0; p < sprayCount; p++) {
                const dist  = _rnd(0, o.length * 0.85);
                const px    = o.sx + Math.cos(o.angle) * dist;
                const py    = o.sy + Math.sin(o.angle) * dist;
                const perp  = (Math.random() - 0.5) * BEAM_HEIGHT * 0.4;
                _spawnParticle(
                    px + Math.cos(o.angle + Math.PI / 2) * perp,
                    py + Math.sin(o.angle + Math.PI / 2) * perp,
                    {
                        color: Math.random() < 0.4 ? "#ffffff" : cfg.accent,
                        size:  _rnd(2, 6),
                        vx:    _rnd(-1.5, 1.5),
                        vy:    _rnd(-1.5, 1.5),
                        life:  180
                    }
                );
            }

            // Fade out sur les dernières frames
            if (o.life < 12) {
                const fade = o.life / 12;
                o.beam.style.opacity     = fade;
                o.beamCore.style.opacity = fade;
            }

            // ── Collision ─────────────────────────────────────────────────
            const proj = (state._playerX - o.sx) * Math.cos(o.angle)
                       + (state._playerY - o.sy) * Math.sin(o.angle);
            const perp = Math.abs(
                        -(state._playerX - o.sx) * Math.sin(o.angle)
                        + (state._playerY - o.sy) * Math.cos(o.angle)
                       );

            if (proj >= 0 && proj <= o.length && perp < state.PLAYER_RADIUS + BEAM_HEIGHT / 2) {
                return true;
            }

            // ── Nettoyage ─────────────────────────────────────────────────
            if (o.life <= 0) {
                o.beam.remove();
                o.beamCore.remove();
                state._objects.splice(i, 1);
            }
        }

        return false;
    };
}