function _rnd(min, max) { return Math.random() * (max - min) + min; }
function _rndInt(min, max) { return Math.floor(_rnd(min, max + 1)); }

export { _rnd, _rndInt };