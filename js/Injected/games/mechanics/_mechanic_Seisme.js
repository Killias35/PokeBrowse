import { _rnd } from "../utils.js";
import { _addTimeout, _addInterval, _arenaFlash, _burstParticles, _screenShake, _spawnParticle } from "../game-engine.js";


// ─── 🌍 SOL : ondes de choc circulaires depuis le bas
export function _mechanic_Seisme(cfg, difficulty, state) {
    const spawnDelay = Math.max(400, 800 - difficulty * 75);
    const startSize = 20                                       // taille de départ
    const maxSize = Math.min(300, startSize * (10 + difficulty * 0.2));               // taille maximale
    const expandSpeed = Math.max(13, 10 + difficulty * 0.2); // vitesse d'expansion

    function spawnShockwave() {
        if (state._isOver) return;
        const spawnDelay = Math.max(50, 100 - difficulty * 5);                // temps avant expension en image

        const cx = _rnd(50, state.ARENA_W - 50);
        const cy = _rnd(50, state.ARENA_H - 50); // depuis le bas

        const preview = document.createElement("div");
        
        preview.style.cssText = `
            position:absolute;
            width:${maxSize * 2}px;
            height:${maxSize * 2}px;
            border-radius:50%;
            border:2px dashed ${cfg.accent};
            opacity:0.4;
            left:${cx}px;
            top:${cy}px;
            transform:translate(-50%,-50%);
            pointer-events:none;
        `;
        state._arena.appendChild(preview);
        
        let previewObj    = { el: preview, cx, cy, r: startSize, speed: expandSpeed, type: "shockwave", spawnDelay, maxSize, alive: true, shockwaves: [], preview: true };
        _addTimeout(() => {
                if (state._isOver) return;
                const shockwave = document.createElement("div");

                shockwave.style.cssText = `
                    position:absolute;
                    width:${startSize}px;
                    height:${startSize}px;
                    border-radius:50%;
                    border:4px solid ${cfg.color};
                    left:${cx}px;
                    top:${cy}px;
                    transform:translate(-50%,-50%);
                    pointer-events:none;
                `;

                let obj           = { el: shockwave, cx, cy, r: startSize, speed: expandSpeed, type: "shockwave", spawnDelay:0, maxSize, alive: false };
                previewObj.shockwaves.push(obj);
                state._objects.push(obj);
                state._arena.appendChild(shockwave);
            }, 0);
        state._objects.push(previewObj);

    }

    _addInterval(spawnShockwave, spawnDelay);

    return function update() {
        for (let i = state._objects.length - 1; i >= 0; i--) {
            const o = state._objects[i];
            if (o.type !== "shockwave" || !o.alive) continue;
            if (o.spawnDelay > 0) { 
                o.spawnDelay--; 
                _spawnParticle(o.cx, o.cy, { color: cfg.color, size: _rnd(3, 8), vx: 0, vy: 0, life: 100 });
                continue; 
            }
            else if(o.spawnDelay <= 0 && o.preview) {   // apparition de l'onde
                o.spawnDelay = -1;
                _screenShake(10, 400);
                _burstParticles(o.cx, o.cy, 12, cfg.color, cfg.accent);
                _arenaFlash(cfg.color, 150);
                for (const shockwave of o.shockwaves) {
                    shockwave.alive = true;
                }
                o.preview = null;
            }
            o.r += o.speed;
            const d = o.r * 2;
            o.el.style.width  = `${d}px`;
            o.el.style.height = `${d}px`;

            const dist = Math.hypot(state._playerX - o.cx, state._playerY - o.cy);
            const thickness = 10;
            if (Math.abs(dist - o.r) < state.PLAYER_RADIUS + thickness && o.alive) return true;

            if (o.r > Math.hypot(state.ARENA_W, state.ARENA_H) * 0.8) {
                o.el.remove(); state._objects.splice(i, 1);
            }
            else if (o.r > o.maxSize || o.preview === null ) {
                o.el.remove(); state._objects.splice(i, 1);
            }
        }
        return false;
    };
}
