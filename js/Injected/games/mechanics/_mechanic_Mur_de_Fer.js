import { _rnd } from "../utils.js";
import { _addTimeout, _addInterval, _arenaFlash, _screenShake, _spawnParticle, _hitRect } from "../game-engine.js";


// ─── ⚙️ ACIER : Cage d'Acier — murs qui couvrent 2/3 d'un bord en chaîne
export function _mechanic_Mur_de_Fer(cfg, difficulty, state) {

    // ── Paramètres ────────────────────────────────────────────────────────

    const spawnDelay      = Math.max(600, 1000 - difficulty * 40);

    // Durée de base de chaque frappe (ms) — temps total preview+mur+retrait
    // À diff 10, ~650ms par frappe → quasi impossible à réagir sur la fin
    let BASE_DURATION     = Math.max(800, 1200 - difficulty * 40);

    // Le timing accélère de 10% par frappe
    const ACCEL_FACTOR      = 0.99;
    const WALL_COVER        = 2 / 3;

    // Pause entre chaque séquence (ms)
    const SEQ_PAUSE         = 0;

    // Répartition du temps : preview / mur actif / retrait
    const PREVIEW_RATIO     = 0.60;   // 38% du temps en preview
    const ACTIVE_RATIO      = 0.2;   // 38% mur plein + collision
    const RETRACT_RATIO     = 0.2;   // 24% retrait rapide


    // ── État ───────────────────────────────────────────────────────────────
    const SIDES             = ["top", "bottom", "left", "right"];
    let lastSide            = SIDES[Math.floor(Math.random() * SIDES.length)];;
    let step                = 0;


    // ── Utilitaires géométrie ──────────────────────────────────────────────

    // Retourne les dimensions du mur complet pour un côté donné
    function getWallRect(side) {
        const W = state.ARENA_W, H = state.ARENA_H;
        let WALL_THICKNESS = side === "left" || side === "right" ? state.ARENA_H : state.ARENA_W;
        switch (side) {
            case "left":
                // longueur = 2/3 de W (parallèle au bord), épaisseur = WALL_THICKNESS (perpendiculaire)
                return { x: 0,                  y: 0,                  w: W * WALL_COVER,  h: WALL_THICKNESS };
            case "right":
                return { x: W * (1 - WALL_COVER), y: H - WALL_THICKNESS, w: W * WALL_COVER, h: WALL_THICKNESS };
            case "top":
                // longueur = 2/3 de H (parallèle au bord), épaisseur = WALL_THICKNESS (perpendiculaire)
                return { x: 0,                  y: 0,                  w: WALL_THICKNESS,  h: H * WALL_COVER };
            case "bottom":
                return { x: W - WALL_THICKNESS, y: H * (1 - WALL_COVER), w: WALL_THICKNESS, h: H * WALL_COVER };
        }
    }

    // Les côtés alternent : top→bottom→left→right ou selon la diff
    // À diff élevée on peut avoir le même axe deux fois de suite
    function pickNextSide(prev, index) {
        if (difficulty >= 7 && Math.random() < 0.35) {
            // Même axe, bord opposé → oblige à traverser plus vite
            const opposites = { top: "bottom", bottom: "top", left: "right", right: "left" };
            return opposites[prev];
        }
        // Sinon : bord différent, légèrement aléatoire
        const pool = SIDES.filter(s => s !== prev);
        return pool[Math.floor(Math.random() * pool.length)];
    }


    // ── Séquence principale ────────────────────────────────────────────────
    async function spawnWall(delay) {
        const side      = lastSide;
        const rect      = getWallRect(side);
        const duration  = BASE_DURATION;
        
        const previewMs = duration * PREVIEW_RATIO;
        const activeMs  = duration * ACTIVE_RATIO;
        const retractMs = duration * RETRACT_RATIO;
    
        BASE_DURATION   *= ACCEL_FACTOR;
        delay           *= ACCEL_FACTOR
        lastSide        = pickNextSide(side, step++);
        step            += 1;

        _addTimeout(() => spawnWall(delay), delay);
        await playStrike(side, rect, previewMs, activeMs, retractMs, step, duration);
    }

    function removePv() {
        pvEl.remove();
        const idx = state._objects.indexOf(pvObj);
        if (idx > -1) state._objects.splice(idx, 1);
    }

    // ── Une frappe complète : preview → mur → retrait ─────────────────────
    function playStrike(side, rect, previewMs, activeMs, retractMs, stepIndex, totalDuration) {
        return new Promise(resolve => {
            if (state._isOver) { resolve(); return; }

            // ── Phase 1 : Preview ──────────────────────────────────────────
            // Un contour pointillé qui grandit depuis 0 jusqu'à la taille finale
            const pvEl = document.createElement("div");
            pvEl.style.cssText = `
                position: absolute;
                pointer-events: none;
                z-index: 5;
                border: 2px dashed ${cfg.color}99;
                background: ${cfg.color}0d;
                box-sizing: border-box;
                transition: none;
            `;
            // Démarre à taille 0 depuis le coin d'origine du mur
            _setRect(pvEl, rect, 0, side);
            state._arena.appendChild(pvEl);
            const pvObj = { el: pvEl, type: "ghost_cleanup" };
            state._objects.push(pvObj);

            // Animation de croissance de la preview sur previewMs
            const pvStart   = performance.now();
            let pvFrame;

            function animPreview(now) {
                if (state._isOver) { removePv(); resolve(); return; }
                const t = Math.min(1, (now - pvStart) / previewMs);
                _setRect(pvEl, rect, t, side);
                if (t < 1) {
                    pvFrame = requestAnimationFrame(animPreview);
                } else {
                    cancelAnimationFrame(pvFrame);
                    // Preview pleine taille atteinte → lancer le mur
                    launchWall();
                }
            }
            pvFrame = requestAnimationFrame(animPreview);


            // ── Phase 2 : Mur ──────────────────────────────────────────────
            function launchWall() {
                if (state._isOver) { removePv(); resolve(); return; }

                _arenaFlash(cfg.color, 120);
                _screenShake(5 + difficulty * 0.6, 200);

                // Particules d'impact sur le bord
                spawnImpactParticles(side, rect);

                const wallEl = document.createElement("div");
                wallEl.style.cssText = `
                    position: absolute;
                    pointer-events: none;
                    z-index: 6;
                    background: linear-gradient(
                        ${side === "left" || side === "right" ? "180deg" : "90deg"},
                        ${cfg.accent} 0%, ${cfg.color} 50%, ${cfg.accent} 100%
                    );
                    box-shadow: 0 0 18px ${cfg.color}, 0 0 35px ${cfg.accent}88;
                    box-sizing: border-box;
                `;
                _setRect(wallEl, rect, 0, side);
                state._arena.appendChild(wallEl);

                // Rivets décoratifs
                addRivets(wallEl, side, rect);

                // Croissance du mur sur activeMs * 0.35
                const growMs    = activeMs * 0.35;
                const growStart = performance.now();
                let growFrame;

                // Objet de collision actif pendant toute la phase mur
                const collObj = {
                    type: "steel_wall_active",
                    el: wallEl,
                    rect: _interpolateRect(rect, 0, side),  // taille 0 au départ, pas rect final
                };
                state._objects.push(collObj);

                function animGrow(now) {
                    if (state._isOver) { wallEl.remove(); removePv(); resolve(); return; }
                    const t = Math.min(1, (now - growStart) / growMs);
                    _setRect(wallEl, rect, t, side);
                    collObj.rect = _interpolateRect(rect, t, side); // collision suit la croissance
                    if (t < 1) {
                        growFrame = requestAnimationFrame(animGrow);
                    } else {
                        cancelAnimationFrame(growFrame);
                        // Mur pleine taille → reste actif pendant le reste de activeMs
                        collObj.rect = { ...rect };
                        _addTimeout(startRetract, activeMs * 0.65);
                    }
                }
                growFrame = requestAnimationFrame(animGrow);


                // ── Phase 3 : Retrait ──────────────────────────────────────
                function startRetract() {
                    if (state._isOver) { wallEl.remove(); removePv(); resolve(); return; }

                    // Preview disparaît au début du retrait
                    pvEl.style.transition = `opacity ${retractMs * 0.3}ms`;
                    pvEl.style.opacity    = "0";
                    _addTimeout(() => removePv(), retractMs * 0.3);

                    const retractStart  = performance.now();
                    let retractFrame;

                    function animRetract(now) {
                        if (state._isOver) { wallEl.remove(); resolve(); return; }
                        const t = Math.min(1, (now - retractStart) / retractMs);
                        // Retrait = croissance inversée (1 → 0)
                        _setRect(wallEl, rect, 1 - t, side);
                        collObj.rect = _interpolateRect(rect, 1 - t, side);
                        if (t < 1) {
                            retractFrame = requestAnimationFrame(animRetract);
                        } else {
                            cancelAnimationFrame(retractFrame);
                            wallEl.remove();
                            const idx = state._objects.indexOf(collObj);
                            if (idx > -1) state._objects.splice(idx, 1);
                            resolve();   // frappe terminée → prochaine
                        }
                    }
                    retractFrame = requestAnimationFrame(animRetract);
                }
            }
        });
    }


    // ── Helpers visuels ────────────────────────────────────────────────────

    // Applique les dimensions interpolées (t=0 → taille 0, t=1 → taille finale)
    // Le mur grandit depuis le bord (origine fixe) vers l'intérieur
    function _setRect(el, rect, t, side) {
        const r = _interpolateRect(rect, t, side);
        el.style.left   = `${r.x}px`;
        el.style.top    = `${r.y}px`;
        el.style.width  = `${r.w}px`;
        el.style.height = `${r.h}px`;
    }

    function _interpolateRect(rect, t, side) {
        switch (side) {
            // top : longueur pleine dès t=0, épaisseur (h) grandit depuis le haut vers le bas
            case "top":
                return { x: rect.x, y: 0, w: rect.w, h: rect.h * t };

            // bottom : longueur pleine dès t=0, épaisseur (h) grandit depuis le bas vers le haut
            case "bottom":
                return { x: rect.x, y: rect.y + rect.h * (1 - t), w: rect.w, h: rect.h * t };

            // left : longueur pleine dès t=0, épaisseur (w) grandit depuis la gauche vers la droite
            case "left":
                return { x: 0, y: rect.y, w: rect.w * t, h: rect.h };

            // right : longueur pleine dès t=0, épaisseur (w) grandit depuis la droite vers la gauche
            case "right":
                return { x: rect.x + rect.w * (1 - t), y: rect.y, w: rect.w * t, h: rect.h };
        }
    }


    function addRivets(el, side, rect) {
        const isH   = side === "top" || side === "bottom";
        const count = Math.floor((isH ? rect.w : rect.h) / 40);
        for (let i = 0; i < count; i++) {
            const r     = document.createElement("div");
            const pos   = (i + 0.5) / count;
            r.style.cssText = `
                position: absolute;
                width: 5px; height: 5px; border-radius: 50%;
                background: ${cfg.accent}; opacity: 0.6;
                ${isH
                    ? `left:${pos * 100}%; top:50%; transform:translate(-50%,-50%)`
                    : `top:${pos * 100}%; left:50%; transform:translate(-50%,-50%)`
                }
            `;
            el.appendChild(r);
        }
    }

    function spawnImpactParticles(side, rect) {
        const count = 8 + difficulty;
        for (let i = 0; i < count; i++) {
            let px, py, vx, vy;
            switch (side) {
                case "top":    px = rect.x + _rnd(0, rect.w); py = rect.h;      vx = _rnd(-1,1); vy = _rnd(1,3);  break;
                case "bottom": px = rect.x + _rnd(0, rect.w); py = rect.y;      vx = _rnd(-1,1); vy = _rnd(-3,-1); break;
                case "left":   px = rect.w;   py = rect.y + _rnd(0, rect.h);    vx = _rnd(1,3);  vy = _rnd(-1,1); break;
                case "right":  px = rect.x;   py = rect.y + _rnd(0, rect.h);    vx = _rnd(-3,-1); vy = _rnd(-1,1); break;
            }
            _spawnParticle(px, py, { color: cfg.accent, size: _rnd(2, 6), vx, vy, life: 400 });
        }
    }


    // ── Intervalles ───────────────────────────────────────────────────────
    _addTimeout(() => spawnWall(spawnDelay), spawnDelay);

    // ── Update : collision uniquement ─────────────────────────────────────
    return function update() {
        if (state._isOver) return false;

        for (const o of state._objects) {
            if (o.type !== "steel_wall_active") continue;
            const r = o.rect;
            if (r.w < 4 || r.h < 4) continue;   // ignore pendant le tout début de croissance
            if (_hitRect(
                state._playerX, state._playerY, state.PLAYER_RADIUS,
                r.x, r.y, r.w, r.h
            )) return true;
        }
        return false;
    };
}