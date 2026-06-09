import { _rnd, _rndInt } from "../utils.js";
import { _addInterval, _addTimeout, _spawnParticle, _arenaFlash, _screenShake, _burstParticles, _hitCircle, _hitRect } from "../game-engine.js";


// ─── 🔥 FEU : Déflagration — colonnes de flammes + mur rotatif
export function _mechanic_Deflagration(cfg, difficulty, state) {

    // ── Paramètres ────────────────────────────────────────────────────────

    // Durée du warning avant une colonne (ms)
    const COLUMN_WARN       = Math.max(600, 1500 - difficulty * 90);

    // Durée active d'une colonne (ms)
    const COLUMN_ACTIVE = Math.max(100, 400 - difficulty * 30);
    
    // Largeur d'une colonne (px)
    const COLUMN_W          = Math.min(70, 28 + difficulty * 4);

    // Intervalle entre colonnes (ms)
    const COLUMN_INTERVAL   = Math.max(1000, 1800 - difficulty * 80);

    // Nombre de colonnes par salve
    const COLUMN_BURST      = 3;

    // Vitesse de rotation du mur (rad/frame) — démarre à diff 4
    const WALL_SPEED        = 0.015;

    // Nombre de bras du mur rotatif
    const WALL_ARMS         = 2 ;

    // Longueur des bras (fraction de l'arène)
    const WALL_LENGTH       = .8;

    // Intervalle de spawn des flammèches tombantes (ms)
    const EMBER_INTERVAL    = Math.max(200, 800 - difficulty * 65);

    const EMBER_SPEED       = 2.5;


    // ── Mur rotatif ───────────────────────────────────────────────────────
    let wallAngle   = Math.random() * Math.PI * 2;
    const wallArms  = [];

    if (WALL_SPEED > 0) {
        for (let arm = 0; arm < WALL_ARMS; arm++) {
            const el = document.createElement("div");
            el.style.cssText = `
                position: absolute;
                pointer-events: none;
                z-index: 4;
                border-radius: 0 8px 8px 0;
                background: linear-gradient(90deg,
                    ${cfg.color}cc,
                    ${cfg.accent} 40%,
                    ${cfg.color}88 70%,
                    transparent
                );
                box-shadow: 0 0 18px ${cfg.color}, 0 0 35px ${cfg.accent}66;
                opacity: 0;
                transition: opacity 1.2s ease-in;
            `;

            // Déclenche le fade-in après le premier frame
            requestAnimationFrame(() => {
                requestAnimationFrame(() => { el.style.opacity = "1"; });
            });

            state._arena.appendChild(el);
            state._objects.push({ el, type: "wall_arm", armIndex: arm, ready: false });
            _addTimeout(() => {
                const obj = state._objects.find(o => o.type === "wall_arm" && o.armIndex === arm);
                if (obj) obj.ready = true;
            }, 1500);

            wallArms.push(el);
        }
    }


    // ── Colonne de flammes ────────────────────────────────────────────────
    function spawnColumnBurst() {
        if (state._isOver) return;

        for (let b = 0; b < COLUMN_BURST; b++) {
            _addTimeout(() => spawnColumn(), b * (COLUMN_WARN * 0.3));
        }
    }

    function spawnColumn() {
        if (state._isOver) return;

        const cx    = _rnd(40, state.ARENA_W - 40);
        const colH  = state.ARENA_H;

        // Indicateur au sol : rectangle fin qui pulse
        const warnEl = document.createElement("div");
        warnEl.style.cssText = `
            position: absolute;
            left:   ${cx - COLUMN_W / 2}px;
            top:    0;
            width:  ${COLUMN_W}px;
            height: ${colH}px;
            background: repeating-linear-gradient(
                180deg,
                ${cfg.color}33 0px, ${cfg.color}33 6px,
                transparent 6px, transparent 14px
            );
            border-left:  1px solid ${cfg.color}55;
            border-right: 1px solid ${cfg.color}55;
            pointer-events: none;
            z-index: 4;
            opacity: 0;
            transition: opacity 0.15s;
        `;
        state._arena.appendChild(warnEl);
        state._objects.push({ el: warnEl, type: "column_warning", ready: false });
        requestAnimationFrame(() => { warnEl.style.opacity = "1"; });

        // Particules de chaleur pendant le warning
        const heatInt = setInterval(() => {
            if (!warnEl.isConnected) { clearInterval(heatInt); return; }
            for (let p = 0; p < 2; p++) {
                _spawnParticle(
                    cx + _rnd(-COLUMN_W / 2, COLUMN_W / 2),
                    _rnd(0, colH),
                    { color: cfg.color, size: _rnd(2, 5),
                      vx: _rnd(-0.5, 0.5), vy: _rnd(-2, -0.5), life: 350 }
                );
            }
        }, 60);
        state._intervals.push(heatInt);

        _addTimeout(() => {
            if (state._isOver) { warnEl.remove(); return; }
            clearInterval(heatInt);
            warnEl.remove();

            // Colonne active
            _arenaFlash(cfg.color, 100);
            _screenShake(5 + difficulty * 0.5, 200);

            const colEl = document.createElement("div");
            colEl.style.cssText = `
                position: absolute;
                left:   ${cx - COLUMN_W / 2}px;
                top:    0;
                width:  ${COLUMN_W}px;
                height: ${colH}px;
                background: linear-gradient(180deg,
                    transparent 0%,
                    ${cfg.accent}cc 15%,
                    ${cfg.color} 40%,
                    white 50%,
                    ${cfg.color} 60%,
                    ${cfg.accent}cc 85%,
                    transparent 100%
                );
                box-shadow: 0 0 20px ${cfg.color}, 0 0 40px ${cfg.accent}88;
                pointer-events: none;
                z-index: 5;
                opacity: 0;
                transition: opacity 0.05s;
            `;
            state._arena.appendChild(colEl);
            requestAnimationFrame(() => { colEl.style.opacity = "1"; });

            const obj = {
                el:     colEl,
                cx,
                x:      cx - COLUMN_W / 2,
                y:      0,
                w:      COLUMN_W,
                h:      colH,
                type:   "fire_column",
            };
            state._objects.push(obj);

            // Burst de particules sur toute la hauteur
            for (let p = 0; p < 12; p++) {
                _spawnParticle(cx + _rnd(-10, 10), _rnd(0, colH), {
                    color: Math.random() < 0.5 ? cfg.color : "#fff",
                    size:  _rnd(3, 8),
                    vx:    _rnd(-2, 2), vy: _rnd(-3, -1), life: 450
                });
            }

            // Disparaît après COLUMN_ACTIVE
            _addTimeout(() => {
                colEl.style.transition = "opacity 0.2s";
                colEl.style.opacity    = "0";
                _addTimeout(() => {
                    colEl.remove();
                    const idx = state._objects.indexOf(obj);
                    if (idx > -1) state._objects.splice(idx, 1);
                }, 200);
            }, COLUMN_ACTIVE);

        }, COLUMN_WARN);
    }


    // ── Flammèches tombantes ──────────────────────────────────────────────
    function spawnEmber() {
        if (state._isOver) return;

        const x     = _rnd(0, state.ARENA_W);
        const size  = _rnd(6, 14);

        const el = document.createElement("div");
        el.style.cssText = `
            position: absolute;
            width:  ${size}px; height: ${size * 1.6}px;
            left:   ${x}px; top: -20px;
            border-radius: 50% 50% 30% 30% / 60% 60% 40% 40%;
            background: radial-gradient(circle at 40% 30%,
                white 0%, ${cfg.accent} 30%, ${cfg.color} 70%, transparent 100%
            );
            box-shadow: 0 0 6px ${cfg.color};
            pointer-events: none;
            z-index: 4;
            transform: rotate(${_rnd(-20, 20)}deg);
        `;
        state._arena.appendChild(el);
        state._objects.push({
            el, x, y: -20,
            vy: EMBER_SPEED,
            vx: _rnd(-0.5, 0.5),
            size,
            type: "ember"
        });
    }


    // ── Intervalles ───────────────────────────────────────────────────────
    _addInterval(spawnColumnBurst, COLUMN_INTERVAL);
    _addInterval(spawnEmber,       EMBER_INTERVAL);


    // ── Update ────────────────────────────────────────────────────────────
    return function update() {
        if (state._isOver) return false;

        // --- Mur rotatif ---
        if (WALL_SPEED > 0 && wallArms.length) {
            wallAngle += WALL_SPEED;

            const cx    = state.ARENA_W / 2;
            const cy    = state.ARENA_H / 2;
            const armL  = Math.min(state.ARENA_W, state.ARENA_H) * WALL_LENGTH;
            const armW  = Math.max(14, 22 - difficulty);

            for (let a = 0; a < WALL_ARMS; a++) {
                const armAngle  = wallAngle + (a / WALL_ARMS) * Math.PI * 2;
                const el        = wallArms[a];

                el.style.left   = `${cx}px`;
                el.style.top    = `${cy - armW / 2}px`;
                el.style.width  = `${armL}px`;
                el.style.height = `${armW}px`;
                el.style.transformOrigin = `0 ${armW / 2}px`;
                el.style.transform = `rotate(${armAngle}rad)`;

                // Particules sur le bout du bras
                if (Math.random() < 0.4) {
                    const tipX = cx + Math.cos(armAngle) * armL;
                    const tipY = cy + Math.sin(armAngle) * armL;
                    _spawnParticle(tipX, tipY, {
                        color: cfg.accent, size: _rnd(3, 7),
                        vx: _rnd(-1.5, 1.5), vy: _rnd(-1.5, 1.5), life: 300
                    });
                }

                // Collision bras (approximation par rectangle orienté)
                const px    = state._playerX - cx;
                const py    = state._playerY - cy;
                const proj  =  px * Math.cos(armAngle) + py * Math.sin(armAngle);
                const perp  = -px * Math.sin(armAngle) + py * Math.cos(armAngle);
                const wallObj = state._objects.find(o => o.type === "wall_arm" && o.armIndex === a);
              if (wallObj?.ready) {
                  if (proj >= 0 && proj <= armL && Math.abs(perp) < state.PLAYER_RADIUS + armW / 2) {
                      return true;
                  }
              }
            }
        }

        // --- Colonnes ---
        for (const o of state._objects) {
            if (o.type !== "fire_column") continue;
            if (Math.abs(state._playerX - o.cx) < state.PLAYER_RADIUS + o.w / 2) return true;
        }

        // --- Flammèches ---
        for (let i = state._objects.length - 1; i >= 0; i--) {
            const o = state._objects[i];
            if (o.type !== "ember") continue;

            o.y += o.vy;
            o.x += o.vx;
            o.el.style.top  = `${o.y}px`;
            o.el.style.left = `${o.x}px`;

            if (_hitCircle(
                state._playerX, state._playerY, state.PLAYER_RADIUS,
                o.x, o.y, o.size / 2
            )) return true;

            if (o.y > state.ARENA_H + 20) {
                o.el.remove();
                state._objects.splice(i, 1);
            }
        }

        return false;
    };
}