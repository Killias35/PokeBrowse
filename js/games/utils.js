function _rnd(min, max) { return Math.random() * (max - min) + min; }
function _rndInt(min, max) { return Math.floor(_rnd(min, max + 1)); }

// ─── PARTICULES : POOL & SPAWN ────────────────────────────────
function _spawnParticle(x, y, { color = "#fff", size = 6, vx = 0, vy = 0, life = 600, shape = "circle", glow = true } = {}) {
  const arena    = document.getElementById("defense-arena");
  const el = document.createElement("div");

  el.className = "dp-particle";
  el.style.cssText = `
    position:absolute;
    width:${size}px; height:${size}px;
    background:${color};
    border-radius:${shape === "circle" ? "50%" : shape === "star" ? "2px" : "3px"};
    left:${x}px; top:${y}px;
    pointer-events:none;
    transform:translate(-50%,-50%) rotate(${shape === "star" ? "45deg" : "0"});
    ${glow ? `box-shadow:0 0 ${size * 1.5}px ${color};` : ""}
    z-index:10;
  `;
  _arena.appendChild(el);

  const start = performance.now();
  const particle = { el, x, y, vx, vy, life, start };
  _particlePool.push(particle);
}

function _burstParticles(x, y, count, color, accent) {
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const speed = _rnd(2, 8);
    _spawnParticle(x, y, {
      color: Math.random() < 0.6 ? color : accent,
      size: _rnd(4, 10),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: _rnd(400, 800),
      glow: true
    });
  }
}

export { _rnd, _rndInt, _spawnParticle, _burstParticles };