// gere le stock de pokeball

async function setStockPokeball() {
    const result = await chrome.storage.local.get("pokeballs");
    const pokeballs = result.pokeballs || [];
    const now = Date.now();
    pokeballs.forEach(pokeball => {
        if(pokeball.count >= pokeball.maxCount) {
            pokeball.count = pokeball.maxCount;
            pokeball.lastUsed = now;
            return;
        }
        const elapsed = now - pokeball.lastUsed;
        const cooldown = pokeball.cooldown * 60 * 60 * 1000;    // heure a minute a seconde a milliseconde
        
        const generated = Math.floor(elapsed / cooldown);
        if (generated >= 1) {
            pokeball.count += generated;
            pokeball.lastUsed += generated * cooldown;
        }
    });

    await chrome.storage.local.set({ pokeballs });
}

async function getRemainingTime(pokeball){
    if(pokeball.count >= pokeball.maxCount) return "---";
    const now = Date.now();
    const elapsed = now - pokeball.lastUsed;
    const cooldown = pokeball.cooldown * 60 * 60 * 1000;    // heure a minute a seconde a milliseconde
    const remaining = cooldown - elapsed;
    const heures = remaining / (60 * 60 * 1000);
    if (heures >= 1) {
        return heures.toFixed(2) + " heures restantes";
    }
    const minutes = remaining / (60 * 1000);
    if (minutes >= 1) {
        return minutes.toFixed(2) + " minutes restantes";
    }
    const secondes = remaining / 1000;
    if (secondes >= 1) {
        return secondes.toFixed(2) + " secondes restantes";
    }
    return "0 secondes restantes";
}

async function getPokeballs() {
    const result = await chrome.storage.local.get("pokeballs");
    return result.pokeballs || [];
}

await setStockPokeball();
export { getRemainingTime, getPokeballs };