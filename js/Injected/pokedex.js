import { playShiny } from "./sound.js";

export async function getPokedex() {
    const result = await chrome.storage.local.get("pokedex");
    return result.pokedex || [];
}

export async function loadCollection() {
    const result = await chrome.storage.local.get("collection");
    const pokemons = result.collection || [];
    let data = {};
    
    // On agrège les captures
    pokemons.forEach((pokemon) => {
        if (!data[pokemon.id]) { 
            data[pokemon.id] = { 
                count: 1, 
                hasShiny: pokemon.isShiny || false // Vérifie si cette capture est shiny
            };
        } else {
            data[pokemon.id].count++;
            if (pokemon.isShiny) {
                data[pokemon.id].hasShiny = true; // S'il l'a eu en shiny au moins une fois
            }
        }
    });
    return data;
}

export async function isCaptured(pokemonId) {
    const collection = await loadCollection();
    return !!collection[pokemonId];
}
