import { freePokemonsAPI, getCaptures } from "../API/capture.js";
import { getIdentifiantParam, getUsernameParam, getCollectionParam, setCollection } from "../settingsUtils.js";

export async function getPokedex() {
    const result = await chrome.storage.local.get("pokedex");
    return result.pokedex || [];
}


export async function getCollection() {
    const identifiant = await getIdentifiantParam();
    const ret = await getCaptures(identifiant);

    if(ret.success) {
        const pokedex = await getPokedex();
        const pokemons = [];
        for(const capture of ret.captures) {
            pokemons.push({id: capture.pokemon_id, isShiny: capture.is_shiny == 1, domaine: capture.domain_name});
        }
        
        const captured = [];
        for(const pokemon of pokemons){
            for(const p of pokedex) {
                if(p.id == pokemon.id) {
                    captured.push({...p, ...pokemon});
                    break;
                }
            }
        }
        return captured;
    }
    return [];
}

export async function loadCollection() {
    const pokemons = await getCollection();
    let data = {};
    
    // On agrège les captures
    pokemons.forEach((pokemon) => {
        if (!data[pokemon.id]) { 
            data[pokemon.id] = { 
                count: 1, 
                hasShiny: pokemon.isShiny || false, // Vérifie si cette capture est shiny
                domain_names: [pokemon.domaine] || []
            };
        } else {
            data[pokemon.id].count++;
            if (pokemon.isShiny) {
                data[pokemon.id].hasShiny = true; // S'il l'a eu en shiny au moins une fois
            }
            if (!data[pokemon.id].domain_names.includes(pokemon.domaine)) {
                data[pokemon.id].domain_names.push(pokemon.domaine);
            }
        }
    });
    await setCollection(data);
    return data;
}

export async function isCaptured(pokemonId) {
    // return true; // DEBUG
    const collection = await getCollectionParam();
    console.log("pokemon:", pokemonId, collection, "isCaptured:", !!collection[pokemonId]);
    return !!collection[pokemonId];
}

export async function freePokemons(){
    const identifiant = await getIdentifiantParam();
    const username = await getUsernameParam();
    const ret = await freePokemonsAPI(username, identifiant);
    if(ret.success == true) {
        await getCollection();
        alert("Tous les Pokémon ont été relâchés dans la nature !");

    }
}
