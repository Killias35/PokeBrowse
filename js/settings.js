// 1. Définition des valeurs par défaut
const defaultSettings = {
    username: "Dresseur",
    volGlobal: 1.0,
    volMusic: 1.0,
    volSfx: 1.0
};

export async function getVolumesParam() {
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

export async function setVolumesParam(volumes){
    chrome.storage.local.set({volumes});
}

export async function setUsernameParam(username){
    chrome.storage.local.set({username});
}

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
function saveSettings() {
    const volumes = {
        globalVolume: sliderGlobal.value,
        musicVolume: sliderMusic.value,
        sfxVolume: sliderSfx.value
    };
    setVolumesParam(volumes);
    setUsernameParam(inputUsername.value);
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
