import { setGlobalVolume } from "./sound.js";
import { getVolumesParam, getUsernameParam, getDescriptionParam, saveToApiParams, setVolumesParam } from "../settingsUtils.js";

// 2. Récupération des éléments HTML
const inputUsername = document.getElementById('username');
const inputDescription = document.getElementById('description');
const sliderGlobal = document.getElementById('vol-global');
const sliderMusic = document.getElementById('vol-music');
const sliderSfx = document.getElementById('vol-sfx');

const valGlobal = document.getElementById('val-global');
const valMusic = document.getElementById('val-music');
const valSfx = document.getElementById('val-sfx');

const btnConfirm = document.getElementById('btn-confirm');
const btnBack = document.getElementById('btn-back');
const btnTraining = document.getElementById('btn-training');

// 3. Fonction pour charger les paramètres au démarrage
async function initSettings() {
    // On vérifie si des paramètres existent déjà dans le localStorage, sinon on prend les valeurs par défaut
    const volumes = await getVolumesParam();
    const username = await getUsernameParam();
    const description = await getDescriptionParam();
    
    // Appliquer les valeurs aux éléments HTML
    inputUsername.value = username;
    inputDescription.value = description;
    if(volumes.globalVolume){
        sliderGlobal.value = volumes.globalVolume;
        valGlobal.textContent = volumes.globalVolume;
    }
    else{
        sliderGlobal.value = defaultSettings.volGlobal;
        valGlobal.textContent = defaultSettings.volGlobal;
    }
    if(volumes.musicVolume){
        sliderMusic.value = volumes.musicVolume;
        valMusic.textContent = volumes.musicVolume;
    }
    else{
        sliderMusic.value = defaultSettings.volMusic;
        valMusic.textContent = defaultSettings.volMusic;
    }
    if(volumes.sfxVolume){
        sliderSfx.value = volumes.sfxVolume;
        valSfx.textContent = volumes.sfxVolume;
    }
    else{
        sliderSfx.value = defaultSettings.volSfx;
        valSfx.textContent = defaultSettings.volSfx;
    }
}

// 4. Fonction pour sauvegarder les paramètres dynamiquement
async function saveSettings() {
    const volumes = {
        globalVolume: sliderGlobal.value,
        musicVolume: sliderMusic.value,
        sfxVolume: sliderSfx.value
    };
    await setVolumesParam(volumes);
    await setGlobalVolume();
    
    if (await saveToApiParams(inputUsername.value, inputDescription.value)){
        alert("Les paramètres ont bien été sauvegardés !");
        btnConfirm.disabled = false;
    }         
}

if(inputUsername){
    
    btnConfirm.addEventListener('click', async () => {
        btnConfirm.disabled = true;
        await saveSettings();
    });

    sliderGlobal.addEventListener('input', () => {
        valGlobal.textContent = sliderGlobal.value;
    });
    sliderMusic.addEventListener('input', () => {
        valMusic.textContent = sliderMusic.value;
    });
    sliderSfx.addEventListener('input', () => {
        valSfx.textContent = sliderSfx.value;
    });

    // 6. Gestion des boutons du bas
    btnBack.addEventListener('click', () => {
        window.location.href = 'popup.html'; 
    });

    btnTraining.addEventListener('click', () => {
        alert("Le mode entraînement sera bientôt disponible !");
    });

    document.addEventListener('DOMContentLoaded', initSettings);
}
