import { updateUser } from "./API/users.js";

function generateUUID() {
    return crypto.randomUUID();
}

const defaultSettings = {
    username: "Dresseur",
    description: "Salut ! Je suis un dresseur de Pokémon !",
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

export async function setVolumesParam(volumes){
    await chrome.storage.local.set({volumes});
}

export async function setUsernameParam(username){
    await chrome.storage.local.set({username});
}

export async function setDescriptionParam(description){
    await chrome.storage.local.set({description});
}

export async function setIdentifiantParam(){
    const identifiant = await getIdentifiantParam();
    if(identifiant !== "") return;
    await chrome.storage.local.set({identifiant: generateUUID()});
}

export async function saveToApiParams(username, description) {
    const identifiant = await getIdentifiantParam();
    const ret = await updateUser(username, description, identifiant);
    if(!ret) {
        alert("Erreur de connection avec l'API !");
        return false;
    }
    await setUsernameParam(username);
    await setDescriptionParam(description);
    return true
}