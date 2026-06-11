import { setGlobalVolume } from "./sound.js";
import { getVolumesParam, getImageParam, getUsernameParam, getDescriptionParam, saveToApiParams, setVolumesParam } from "../settingsUtils.js";

// Image par défaut (si lien vide ou cassé)
const DEFAULT_AVATAR = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png";

// Récupération des éléments HTML
const inputImage = document.getElementById('image');
const imagePreview = document.getElementById('image-preview'); // Nouvel élément
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

// Valeurs par défaut si aucune n'est trouvée
const defaultSettings = {
    volGlobal: 1.0,
    volMusic: 1.0,
    volSfx: 1.0
};

// Fonction pour charger les paramètres au démarrage
async function initSettings() {
    const volumes = await getVolumesParam() || {};
    const image = await getImageParam();
    const username = await getUsernameParam();
    const description = await getDescriptionParam();
    
    // Appliquer les valeurs aux éléments HTML
    inputImage.value = image || "";
    updateImagePreview(inputImage.value); // Mise à jour de l'aperçu

    inputUsername.value = username || "";
    inputDescription.value = description || "";
    
    // Volumes avec fallback
    sliderGlobal.value = volumes.globalVolume !== undefined ? volumes.globalVolume : defaultSettings.volGlobal;
    valGlobal.textContent = sliderGlobal.value;

    sliderMusic.value = volumes.musicVolume !== undefined ? volumes.musicVolume : defaultSettings.volMusic;
    valMusic.textContent = sliderMusic.value;

    sliderSfx.value = volumes.sfxVolume !== undefined ? volumes.sfxVolume : defaultSettings.volSfx;
    valSfx.textContent = sliderSfx.value;
}

// Fonction utilitaire pour mettre à jour l'aperçu
function updateImagePreview(url) {
    imagePreview.src = url ? url : DEFAULT_AVATAR;
}

// Fonction pour sauvegarder les paramètres
async function saveSettings() {
    const volumes = {
        globalVolume: sliderGlobal.value,
        musicVolume: sliderMusic.value,
        sfxVolume: sliderSfx.value
    };
    
    await setVolumesParam(volumes);
    await setGlobalVolume(); // Applique le volume
    
    try {
        if (await saveToApiParams(inputImage.value, inputUsername.value, inputDescription.value)){
            // Changer le texte du bouton temporairement pour confirmer
            const originalText = btnConfirm.innerHTML;
            btnConfirm.innerHTML = "✅ Sauvegardé !";
            btnConfirm.classList.remove('confirm');
            
            setTimeout(() => {
                btnConfirm.disabled = false;
                btnConfirm.innerHTML = originalText;
                btnConfirm.classList.add('confirm');
            }, 1500);
        } else {
            btnConfirm.disabled = false;
        }
    } catch (e) {
        console.error("Erreur de sauvegarde:", e);
        btnConfirm.disabled = false;
        alert("Erreur lors de la sauvegarde.");
    }
}

// S'assurer que le script s'exécute quand le DOM est prêt
if(inputUsername) {
    
    // Événement pour l'aperçu en direct de l'image
    inputImage.addEventListener('input', () => {
        updateImagePreview(inputImage.value);
    });

    // Si le lien de l'image est cassé, on met l'avatar par défaut
    imagePreview.addEventListener('error', () => {
        imagePreview.src = DEFAULT_AVATAR;
    });

    btnConfirm.addEventListener('click', async () => {
        btnConfirm.disabled = true;
        btnConfirm.innerHTML = "⏳ Enregistrement...";
        await saveSettings();
    });

    // Événements pour mettre à jour les valeurs textuelles des sliders
    sliderGlobal.addEventListener('input', () => { valGlobal.textContent = sliderGlobal.value; });
    sliderMusic.addEventListener('input', () => { valMusic.textContent = sliderMusic.value; });
    sliderSfx.addEventListener('input', () => { valSfx.textContent = sliderSfx.value; });

    // Gestion des boutons du bas
    btnBack.addEventListener('click', () => {
        window.location.href = 'popup.html'; 
    });

    btnTraining.addEventListener('click', () => {
        alert("Le mode entraînement sera bientôt disponible !");
    });

    document.addEventListener('DOMContentLoaded', initSettings);
}