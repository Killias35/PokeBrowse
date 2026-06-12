import { updateUser, getUserByUsername } from "./API/users.js";
import { getCaptures } from "./API/capture.js";
import { getPokedex } from "./Injected/pokedex.js";

export const defaultSettings = {
    username: "Dresseur",
    description: "Salut ! Je suis un dresseur de Pokémon !",
    image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png",
    volGlobal: 1.0,
    volMusic: 1.0,
    volSfx: 1.0
};

export async function getVolumesParam() {
    if (!chrome.storage?.local) {
        console.error("chrome.storage.local indisponible");
        return;
    }
    const res = await chrome.storage.local.get(["volumes"]);
    if (!res.volumes) {
        return {
            globalVolume: defaultSettings.volGlobal,
            musicVolume: defaultSettings.volMusic,
            sfxVolume: defaultSettings.volSfx
        };
    }

    return res.volumes;
}

export async function getImageParam(){
    const res = await chrome.storage.local.get(["image"]);
    if (!res.image) return defaultSettings.image;
    return res.image;
}

export async function getUsernameParam(){
    const res = await chrome.storage.local.get(["username"]);
    if (!res.username) return defaultSettings.username;
    return res.username;
}

export async function getDescriptionParam(){
    const res = await chrome.storage.local.get(["description"]);
    if (!res.description) return defaultSettings.description;
    return res.description;
}

export async function getIdentifiantParam(){
    const res = await chrome.storage.local.get(["identifiant"]);
    if (!res.identifiant) return "";
    return res.identifiant;
}

export async function getCollection() {
    const username = await getUsernameParam();
    if(await getUserByUsername(username) !== undefined) {
        const pokedex = await getPokedex();
        const ret = await getCaptures(username);
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
        await setCollection(captured);
        return captured;
    }
    return [];
}

export async function setVolumesParam(volumes){
    await chrome.storage.local.set({volumes});
}

export async function setImageParam(image){
    await chrome.storage.local.set({image});
}

export async function setUsernameParam(username){
    await chrome.storage.local.set({username});
}

export async function setDescriptionParam(description){
    await chrome.storage.local.set({description});
}

export async function setIdentifiantParam(identifiant){
    await chrome.storage.local.set({identifiant });
}

export async function setCollection(collection){
    await chrome.storage.local.set({collection});
}

export async function saveToApiParams(username, identifiant, image, description) {
    const ret = await updateUser(image, username, description, identifiant);
    if(!ret) {
        alert("Erreur de connection avec l'API !");
        return false;
    }
    await saveParams(username, identifiant, image, description);
    return true
}

export async function saveParams(username, identifiant, image, description) {
    await setUsernameParam(username);
    await setIdentifiantParam(identifiant);
    await setImageParam(image);
    await setDescriptionParam(description);
    const collection = await getCollection();
    await setCollection(collection);
}

export async function deleteSettings() {    // Deconnecter
    await chrome.storage.local.remove("image");
    await chrome.storage.local.remove("username");
    await chrome.storage.local.remove("identifiant");
    await chrome.storage.local.remove("description");
    await chrome.storage.local.remove("collection");
    await chrome.storage.local.remove("huntActive");
    await chrome.storage.local.remove("pokeballs");
    await chrome.storage.local.remove("pokedex");
    await chrome.storage.local.remove("currentBattlePokemon");
    console.log("Paramètres supprimés.");
}
