import { setGlobalVolume } from "./sound.js";
import { getVolumesParam, getImageParam, getUsernameParam, 
    getDescriptionParam, saveParams, saveToApiParams, 
    setVolumesParam, getIdentifiantParam, setIdentifiantParam, 
    setUsernameParam, defaultSettings, base_image, DEFAULT_AVATAR } from "../settingsUtils.js";
import { isLoged, register, login } from "../API/users.js"; // Ajout de l'API


// Éléments HTML
const inputImage = document.getElementById('image');
const imagePreview = document.getElementById('image-preview');
const inputUsername = document.getElementById('username');
const inputIdentifiant = document.getElementById('identifiant'); // Nouveau
const inputDescription = document.getElementById('description');

// Sections & Boutons Auth
const authButtons = document.getElementById('auth-buttons');
const profileSection = document.getElementById('profile-section');
const authMessage = document.getElementById('auth-message');
const btnLogin = document.getElementById('btn-login');
const btnRegister = document.getElementById('btn-register');

// Audio
const sliderGlobal = document.getElementById('vol-global');
const sliderMusic = document.getElementById('vol-music');
const sliderSfx = document.getElementById('vol-sfx');
const valGlobal = document.getElementById('val-global');
const valMusic = document.getElementById('val-music');
const valSfx = document.getElementById('val-sfx');

const btnConfirm = document.getElementById('btn-confirm');
const btnBack = document.getElementById('btn-back');
const btnTraining = document.getElementById('btn-training');

// Variable d'état
let isLoggedIn = false;

async function initSettings() {
    const volumes = await getVolumesParam() || {};
    const image = await getImageParam();
    const username = await getUsernameParam();
    const description = await getDescriptionParam();
    
    // On suppose que tu as rajouté getIdentifiantParam() dans tes utils
    const identifiant = await getIdentifiantParam(); 
    
    inputImage.value = image || DEFAULT_AVATAR;
    await updateImagePreview(inputImage.value);

    inputUsername.value = username || "";
    inputIdentifiant.value = identifiant || "";
    inputDescription.value = description || "";
    
    // Volumes avec fallback
    sliderGlobal.value = volumes.globalVolume !== undefined ? volumes.globalVolume : defaultSettings.volGlobal;
    valGlobal.textContent = sliderGlobal.value;

    sliderMusic.value = volumes.musicVolume !== undefined ? volumes.musicVolume : defaultSettings.volMusic;
    valMusic.textContent = sliderMusic.value;

    sliderSfx.value = volumes.sfxVolume !== undefined ? volumes.sfxVolume : defaultSettings.volSfx;
    valSfx.textContent = sliderSfx.value;

    // Vérification de la connexion automatique
    if (username && identifiant) {
        const logged = await isLoged(username, identifiant);
        setLoggedInState(logged);
    } else {
        setLoggedInState(false);
    }
}

function verifierImage(url) {
  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);

    img.src = url;
  });
}

async function updateImagePreview(nb) {
    const url = base_image + nb + ".png";
    if(await verifierImage(url)) {
        imagePreview.src = url;
    } else {
        imagePreview.src = base_image + DEFAULT_AVATAR + ".png";
    }
}

// Fonction pour gérer l'affichage selon l'état de connexion
function setLoggedInState(state) {
    isLoggedIn = state;
    if (state) {
        inputUsername.disabled = true;
        inputIdentifiant.disabled = true;
        authButtons.classList.add('hidden');
        profileSection.classList.remove('hidden');
        showMessage("Connecté avec succès !", "success");
    } else {
        inputUsername.disabled = false;
        inputIdentifiant.disabled = false;
        authButtons.classList.remove('hidden');
        profileSection.classList.add('hidden');
    }
}

// Fonction pour afficher les erreurs/succès
function showMessage(msg, type) {
    authMessage.textContent = msg;
    authMessage.className = `auth-message ${type}`;
    authMessage.classList.remove('hidden');
    
    // Masquer le message après 3 secondes (sauf si erreur grave, optionnel)
    setTimeout(() => {
        authMessage.classList.add('hidden');
    }, 3000);
}

// --- GESTION DE L'AUTHENTIFICATION ---

btnLogin.addEventListener('click', async () => {
    const u = inputUsername.value.trim();
    const i = inputIdentifiant.value.trim();
    
    if (!u || !i) return showMessage("Veuillez remplir les deux champs.", "error");

    btnLogin.disabled = true;
    btnLogin.textContent = "⏳...";
    
    const rep = await login(u, i);
    const logged = rep.success === true;
    const user = rep.user;
    
    if (logged) {
        await saveParams(u, i, user.image, user.description);
        setLoggedInState(true);
    } else {
        showMessage("Identifiants incorrects.", "error");
    }
    
    btnLogin.disabled = false;
    btnLogin.textContent = "🔑 Connexion";

    location.reload();
});

btnRegister.addEventListener('click', async () => {
    const u = inputUsername.value.trim();
    const i = inputIdentifiant.value.trim();
    
    if (!u || !i) return showMessage("Veuillez remplir les deux champs.", "error");

    btnRegister.disabled = true;
    btnRegister.textContent = "⏳...";
    
    const response = await register(u, i, defaultSettings.image, defaultSettings.description);
    
    if (response.success) {
        await setIdentifiantParam(i);
        await setUsernameParam(u);
        setLoggedInState(true);
        showMessage("Compte créé avec succès !", "success");
    } else {
        showMessage(response.message || "Erreur lors de la création.", "error");
    }
    
    btnRegister.disabled = false;
    btnRegister.textContent = "📝 Créer un compte";
});


// --- SAUVEGARDE (Audio + Profil) ---
async function saveSettings() {
    // 1. Sauvegarde des volumes
    const volumes = {
        globalVolume: sliderGlobal.value,
        musicVolume: sliderMusic.value,
        sfxVolume: sliderSfx.value
    };
    
    await setVolumesParam(volumes);
    await setGlobalVolume();
    const volumesParam = await getVolumesParam();
    const GLOBAL_MUSIC_VOLUME = volumesParam.musicVolume * volumesParam.globalVolume;
    await chrome.runtime.sendMessage({ action: "RELOAD_MUSIC", GLOBAL_MUSIC_VOLUME, type: "hunt" });
    
    // 2. Sauvegarde du profil (Seulement si connecté)
    if (isLoggedIn) {
        try {
            const username = await getUsernameParam();
            const identifiant = await getIdentifiantParam();
            if (await saveToApiParams(username, identifiant, inputImage.value, inputDescription.value)) {
                btnConfirm.innerHTML = "✅ Sauvegardé !";
                btnConfirm.classList.remove('confirm');
                
                setTimeout(() => {
                    btnConfirm.disabled = false;
                    btnConfirm.innerHTML = "✔️ Enregistrer (Profil & Audio)";
                    btnConfirm.classList.add('confirm');
                }, 1500);
            } else {
                btnConfirm.disabled = false;
                showMessage("Erreur API lors de la sauvegarde du profil.", "error");
            }
        } catch (e) {
            console.error("Erreur de sauvegarde:", e);
            btnConfirm.disabled = false;
            showMessage("Erreur lors de la sauvegarde.", "error");
        }
    } else {
        // Si non connecté, on a juste sauvegardé le son
        btnConfirm.innerHTML = "✅ Audio Sauvegardé !";
        setTimeout(() => {
            btnConfirm.disabled = false;
            btnConfirm.innerHTML = "✔️ Enregistrer (Profil & Audio)";
        }, 1500);
    }
}

if(inputUsername) {
    inputImage.addEventListener('input', async () => await updateImagePreview(inputImage.value));
    imagePreview.addEventListener('error', () => imagePreview.src = DEFAULT_AVATAR);

    btnConfirm.addEventListener('click', async () => {
        btnConfirm.disabled = true;
        btnConfirm.innerHTML = "⏳ Enregistrement...";
        await saveSettings();
    });

    sliderGlobal.addEventListener('input', () => { valGlobal.textContent = sliderGlobal.value; });
    sliderMusic.addEventListener('input', () => { valMusic.textContent = sliderMusic.value; });
    sliderSfx.addEventListener('input', () => { valSfx.textContent = sliderSfx.value; });

    btnBack.addEventListener('click', () => { window.location.href = 'popup.html'; });
    btnTraining.addEventListener('click', () => { alert("Le mode entraînement sera bientôt disponible !"); });

    document.addEventListener('DOMContentLoaded', initSettings);
}