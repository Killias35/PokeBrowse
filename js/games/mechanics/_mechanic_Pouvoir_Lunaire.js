import { _rnd } from "../utils.js";
import { _addTimeout, _addInterval, _arenaFlash, _screenShake, _spawnParticle, _hitCircle } from "../game-engine.js";


// ─── 🌟 FÉE : Éclat Astral — constellations qui s'activent
export function _mechanic_Pouvoir_Lunaire(cfg, difficulty, state) {

    // ── Paramètres ────────────────────────────────────────────────────────

    // Nombre d'étoiles par constellation
    const STAR_COUNT        = Math.min(7, 3 + Math.floor(difficulty / 2.5));

    // Durée de la phase de dessin des traits (ms) — joueur voit le pattern
    const DRAW_DURATION     = Math.max(800, 2000 - difficulty * 120);

    // Durée de la phase active (traits mortels) (ms)
    const ACTIVE_DURATION   = 300;

    // Durée du fade out (ms)
    const FADE_DURATION     = 200;

    // Intervalle entre chaque constellation (ms)
    const SPAWN_INTERVAL    = Math.max(300, 800 - difficulty * 50);

    // Rayon des étoiles (collision)
    const STAR_RADIUS       = Math.max(10, 20 - difficulty * 1);

    // Épaisseur des traits (collision)
    const LINE_THICKNESS    = Math.max(6, 16 - difficulty * 1);

    // Délai entre l'apparition de chaque étoile dans la constellation (ms)
    const STAR_STAGGER      = Math.max(30, 150 - difficulty * 12);
    
    // Ecart entre chaque étoile de la constellation
    const SPREAD    = Math.min(170, 70 + difficulty * 10);


    // ── Injection CSS ─────────────────────────────────────────────────────
    if (!document.getElementById("_fairy-style")) {
        const s = document.createElement("style");
        s.id = "_fairy-style";
        s.textContent = `
            @keyframes _starAppear {
                0%   { transform: translate(-50%,-50%) scale(0) rotate(0deg);   opacity: 0; }
                60%  { transform: translate(-50%,-50%) scale(1.3) rotate(180deg); opacity: 1; }
                100% { transform: translate(-50%,-50%) scale(1) rotate(360deg);  opacity: 1; }
            }
            @keyframes _starPulse {
                0%,100% { transform: translate(-50%,-50%) scale(1)   rotate(0deg); }
                50%     { transform: translate(-50%,-50%) scale(1.15) rotate(180deg); }
            }
            @keyframes _starDanger {
                0%,100% { box-shadow: 0 0 12px 4px var(--star-color); }
                50%     { box-shadow: 0 0 28px 10px var(--star-color); }
            }
            @keyframes _constellationWarn {
                0%,100% { opacity: 0.85; }
                50%     { opacity: 1; }
            }
        `;
        document.head.appendChild(s);
    }

    // ── Spawn d'une constellation ─────────────────────────────────────────
    function spawnConstellation() {
        if (state._isOver) return;
        // Génère les positions des étoiles — légèrement clusterisées
        const stars     = [];
        const cx        = _rnd(-20, state.ARENA_W);
        const cy        = _rnd(-20, state.ARENA_H);

        const baseRadius = SPREAD;
        const STARS = STAR_COUNT + _rnd(0, 2);

        for (let i = 0; i < STAR_COUNT; i++) {

            const angle =
                (i / STAR_COUNT) * Math.PI * 2 +
                _rnd(-0.25, 0.25);

            const radius =
                baseRadius +
                _rnd(-SPREAD * 0.2, SPREAD * 0.2);

            stars.push({
                x: cx + Math.cos(angle) * radius,
                y: cy + Math.sin(angle) * radius,
            });
        }

        // Ordre de connexion : forme un polygone + une diagonale centrale si impair
        const connections = [];
        for (let i = 0; i < stars.length; i++) {
            connections.push([i, (i + 1) % stars.length]);
        }
        // Diagonale au centre pour rendre le pattern plus complexe à diff élevée
        if (difficulty >= 5 && stars.length >= 5) {
            connections.push([0, Math.floor(stars.length / 2)]);
        }
        if (difficulty >= 8 && stars.length >= 6) {
            connections.push([1, Math.floor(stars.length / 2) + 1]);
        }

        const constObj = {
            type:           "constellation",
            stars,
            connections,
            starEls:        [],
            lineEls:        [],
            lineCanvases:   [],
            phase:          "drawing",  // drawing → active → fading
            drawProgress:   0,          // 0 → connections.length
            activeTimer:    0,
            alive:          true,
        };
        state._objects.push(constObj);

        // ── Spawn des étoiles en décalé ───────────────────────────────────
        stars.forEach((s, idx) => {
            _addTimeout(() => {
                if (state._isOver || !constObj.alive) return;

                const el = document.createElement("div");
                el.style.cssText = `
                    position: absolute;
                    left: ${s.x}px; top: ${s.y}px;
                    width:  ${STAR_RADIUS * 2}px;
                    height: ${STAR_RADIUS * 2}px;
                    border-radius: 50%;
                    background: ${cfg.color};
                    --star-color: ${cfg.color};
                    box-shadow: 0 0 12px 4px ${cfg.color};
                    pointer-events: none;
                    z-index: 7;
                    animation: _starAppear 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards;
                `;
                state._arena.appendChild(el);
                state._objects.push({ type: "star", el });
                constObj.starEls.push(el);

                // Particules d'apparition
                for (let p = 0; p < 6; p++) {
                    const a = (p / 6) * Math.PI * 2;
                    _spawnParticle(
                        s.x + Math.cos(a) * 12,
                        s.y + Math.sin(a) * 12,
                        { color: cfg.color, size: _rnd(2, 5),
                          vx: Math.cos(a) * _rnd(0.8, 2),
                          vy: Math.sin(a) * _rnd(0.8, 2), life: 500 }
                    );
                }
            }, idx * STAR_STAGGER);
        });

        // ── Dessin progressif des traits ──────────────────────────────────
        // Chaque trait est un canvas SVG inline
        const timePerLine = (DRAW_DURATION - STAR_COUNT * STAR_STAGGER) / connections.length;

        connections.forEach((conn, idx) => {
            _addTimeout(() => {
                if (state._isOver || !constObj.alive) return;

                const s1 = stars[conn[0]], s2 = stars[conn[1]];
                drawLine(constObj, s1, s2, idx, timePerLine);
            }, STAR_COUNT * STAR_STAGGER + idx * timePerLine);
        });

        // ── Après le dessin : activation ──────────────────────────────────
        _addTimeout(() => {
            if (state._isOver || !constObj.alive) return;
            activateConstellation(constObj);
        }, DRAW_DURATION);
    }


    // ── Dessin d'un trait avec animation ──────────────────────────────────
    function drawLine(constObj, s1, s2, idx, duration) {
        const svgNS = "http://www.w3.org/2000/svg";
        const svg   = document.createElementNS(svgNS, "svg");

        // Bounding box du trait avec padding
        const pad   = 20;
        const minX  = Math.min(s1.x, s2.x) - pad;
        const minY  = Math.min(s1.y, s2.y) - pad;
        const maxX  = Math.max(s1.x, s2.x) + pad;
        const maxY  = Math.max(s1.y, s2.y) + pad;
        const w     = maxX - minX;
        const h     = maxY - minY;

        svg.setAttribute("width",  w);
        svg.setAttribute("height", h);
        svg.style.cssText = `
            position: absolute;
            left: ${minX}px; top: ${minY}px;
            pointer-events: none;
            z-index: 6;
            overflow: visible;
        `;

        // Trait principal
        const line  = document.createElementNS(svgNS, "line");
        line.setAttribute("x1", s1.x - minX);
        line.setAttribute("y1", s1.y - minY);
        line.setAttribute("x2", s2.x - minX);
        line.setAttribute("y2", s2.y - minY);
        line.setAttribute("stroke", cfg.color);
        line.setAttribute("stroke-width", LINE_THICKNESS * 0.5);
        line.setAttribute("stroke-linecap", "round");
        line.setAttribute("opacity", "0.6");

        // Trait de glow
        const glow  = document.createElementNS(svgNS, "line");
        glow.setAttribute("x1", s1.x - minX);
        glow.setAttribute("y1", s1.y - minY);
        glow.setAttribute("x2", s2.x - minX);
        glow.setAttribute("y2", s2.y - minY);
        glow.setAttribute("stroke", cfg.accent);
        glow.setAttribute("stroke-width", LINE_THICKNESS * 0.2);
        glow.setAttribute("stroke-linecap", "round");
        glow.setAttribute("opacity", "0.9");
        glow.setAttribute("filter", `drop-shadow(0 0 4px ${cfg.accent})`);

        // Animation strokeDashoffset pour dessiner le trait progressivement
        const len   = Math.hypot(s2.x - s1.x, s2.y - s1.y);
        [line, glow].forEach(l => {
            l.setAttribute("stroke-dasharray",  len);
            l.setAttribute("stroke-dashoffset", len);
            l.style.transition = `stroke-dashoffset ${duration}ms ease-out`;
        });

        svg.appendChild(line);
        svg.appendChild(glow);
        state._arena.appendChild(svg);
        state._objects.push({ el: svg, line, glow, s1, s2 });
        constObj.lineEls.push({ svg, line, glow, s1, s2 });

        // Déclenche l'animation
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                line.setAttribute("stroke-dashoffset", "0");
                glow.setAttribute("stroke-dashoffset", "0");
            });
        });

        // Particules le long du trait pendant le dessin
        let particleCount = 0;
        const maxParticles = 8;
        const particleInterval = setInterval(() => {
            if (state._isOver || particleCount++ >= maxParticles) {
                clearInterval(particleInterval);
                return;
            }
            const prog  = particleCount / maxParticles;
            const px    = s1.x + (s2.x - s1.x) * prog;
            const py    = s1.y + (s2.y - s1.y) * prog;
            _spawnParticle(px, py, {
                color: cfg.accent, size: _rnd(2, 4),
                vx: _rnd(-0.5, 0.5), vy: _rnd(-1, -0.2), life: 400
            });
        }, duration / maxParticles);
        state._intervals.push(particleInterval);
    }


    // ── Activation : les traits deviennent mortels ─────────────────────────
    function activateConstellation(constObj) {
        constObj.phase = "active";

        _arenaFlash(cfg.color, 300);
        _screenShake(4 + difficulty * 0.5, 300);

        // Les étoiles pulsent rapidement pour signaler le danger
        constObj.starEls.forEach(el => {
            el.style.animation = `_starDanger 0.3s ease infinite`;
            el.style.background = cfg.accent;
            el.style.setProperty("--star-color", cfg.accent);
            el.style.boxShadow  = `0 0 20px 8px ${cfg.accent}`;
        });

        // Les traits s'illuminent
        constObj.lineEls.forEach(({ line, glow }) => {
            line.setAttribute("stroke",        cfg.accent);
            line.setAttribute("stroke-width",  LINE_THICKNESS);
            line.setAttribute("opacity",       "1");
            glow.setAttribute("stroke-width",  LINE_THICKNESS * 0.5);
        });

        // Burst de particules sur chaque étoile
        constObj.stars.forEach(s => {
            for (let p = 0; p < 8; p++) {
                const a = (p / 8) * Math.PI * 2;
                _spawnParticle(s.x, s.y, {
                    color: cfg.accent, size: _rnd(3, 7),
                    vx: Math.cos(a) * _rnd(1, 3),
                    vy: Math.sin(a) * _rnd(1, 3), life: 500
                });
            }
        });

        // Après ACTIVE_DURATION → fade out
        _addTimeout(() => {
            if (!constObj.alive) return;
            fadeConstellation(constObj);
        }, ACTIVE_DURATION);
    }


    // ── Fade out et nettoyage ─────────────────────────────────────────────
    function fadeConstellation(constObj) {
        constObj.phase = "fading";

        constObj.starEls.forEach(el => {
            el.style.transition = `opacity ${FADE_DURATION}ms`;
            el.style.opacity    = "0";
        });
        constObj.lineEls.forEach(({ svg }) => {
            svg.style.transition = `opacity ${FADE_DURATION}ms`;
            svg.style.opacity    = "0";
        });

        _addTimeout(() => {
            constObj.alive = false;
            constObj.starEls.forEach(el  => el.remove());
            constObj.lineEls.forEach(({ svg }) => svg.remove());
            const idx = state._objects.indexOf(constObj);
            if (idx > -1) state._objects.splice(idx, 1);
        }, FADE_DURATION);
    }


    // ── Collision sur un segment ──────────────────────────────────────────
    function distPointToSegment(px, py, ax, ay, bx, by) {
        const dx = bx - ax, dy = by - ay;
        const lenSq = dx * dx + dy * dy;
        if (lenSq === 0) return Math.hypot(px - ax, py - ay);
        const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
        return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
    }


    _addInterval(spawnConstellation, SPAWN_INTERVAL);


    // ── Update ────────────────────────────────────────────────────────────
    return function update(now) {
        if (state._isOver) return false;

        const t = now * 0.001;

        for (let i = state._objects.length - 1; i >= 0; i--) {
            const o = state._objects[i];
            if (o.type !== "constellation" || !o.alive) continue;

            // Scintillement des étoiles pendant le dessin
            if (o.phase === "drawing") {
                o.starEls.forEach((el, idx) => {
                    const pulse = 0.85 + 0.15 * Math.sin(t * 3 + idx);
                    el.style.opacity = pulse;
                });
            }

            // Phase active : collision sur étoiles ET traits
            if (o.phase === "active") {

                // Collision étoiles
                for (const s of o.stars) {
                    if (_hitCircle(
                        state._playerX, state._playerY, state.PLAYER_RADIUS,
                        s.x, s.y, STAR_RADIUS
                    )) return true;
                }

                // Collision traits
                for (const conn of o.connections) {
                    const s1 = o.stars[conn[0]];
                    const s2 = o.stars[conn[1]];
                    const dist = distPointToSegment(
                        state._playerX, state._playerY,
                        s1.x, s1.y, s2.x, s2.y
                    );
                    if (dist < state.PLAYER_RADIUS + LINE_THICKNESS / 2) return true;
                }
            }
        }

        return false;
    };
}