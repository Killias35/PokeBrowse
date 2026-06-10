import { setGlobalVolume } from "./sound.js";
import { getVolumesParam, getUsernameParam, setVolumesParam, setUsernameParam } from "../settingsUtils.js";

// 2. Récupération des éléments HTML
const inputUsername = document.getElementById('username');
const sliderGlobal = document.getElementById('vol-global');
const sliderMusic = document.getElementById('vol-music');
const sliderSfx = document.getElementById('vol-sfx');

const valGlobal = document.getElementById('val-global');
const valMusic = document.getElementById('val-music');
const valSfx = document.getElementById('val-sfx');

const btnBack = document.getElementById('btn-back');
const btnTraining = document.getElementById('btn-training');

// 3. Fonction pour charger les paramètres au démarrage
async function initSettings() {
    // On vérifie si des paramètres existent déjà dans le localStorage, sinon on prend les valeurs par défaut
    const volumes = await getVolumesParam();
    const username = await getUsernameParam();
    
    // Appliquer les valeurs aux éléments HTML
    inputUsername.value = username;
    console.log(volumes);
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
    await setUsernameParam(inputUsername.value);
    await setGlobalVolume();
}

if(inputUsername){
    // Pour le nom d'utilisateur (sauvegarde quand on tape)
    inputUsername.addEventListener('input', saveSettings);

    // Pour le volume Global
    sliderGlobal.addEventListener('input', (e) => {
        valGlobal.textContent = e.target.value;
        saveSettings();
    });

    // Pour le volume Musique
    sliderMusic.addEventListener('input', (e) => {
        valMusic.textContent = e.target.value;
        saveSettings();
    });

    // Pour le volume SFX
    sliderSfx.addEventListener('input', (e) => {
        valSfx.textContent = e.target.value;
        saveSettings();
    });

    // 6. Gestion des boutons du bas
    btnBack.addEventListener('click', () => {
        // Remplace 'index.html' par le nom de ta page principale
        window.location.href = 'popup.html'; 
    });

    btnTraining.addEventListener('click', () => {
        alert("Le mode entraînement sera bientôt disponible !");
    });

    document.addEventListener('DOMContentLoaded', initSettings);
}
