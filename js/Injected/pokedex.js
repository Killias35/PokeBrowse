import { freePokemonsAPI } from "../API/capture.js";
import { getIdentifiantParam, getUsernameParam, getCollection } from "../settingsUtils.js";

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
    // return true; // DEBUG
    const collection = await loadCollection();
    return !!collection[pokemonId];
}

export async function freePokemons(){
    const identifiant = await getIdentifiantParam();
    const username = await getUsernameParam();
    const ret = await freePokemonsAPI(username, identifiant);
    console.log(ret);
    if(ret.success == true) {
        await getCollection();
        alert("Tous les Pokémon ont été relâchés dans la nature !");

    }
}
