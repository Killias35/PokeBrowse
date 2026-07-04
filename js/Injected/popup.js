import { getPokeballs } from "./pokeballs.js";
import { getSpawnsForDomain } from "./utils.js";
import { isLoged, register } from "../API/users.js";
import { getImageParam, getUsernameParam, getIdentifiantParam, getDescriptionParam, deleteSettings } from "../settingsUtils.js";

async function getDelaiFromLastSpawn() {
  const lastSpawn = await chrome.storage.local.get("lastSpawn");
  const lastSpawnTime = lastSpawn.lastSpawn || 0;
  const now = Date.now();
  const hours = (now - lastSpawnTime) / (60 * 60 * 1000);
  return hours;
}

function updateUI() {
  if (huntActive) {
    toggleBtn.classList.remove("hunt-off");
    toggleBtn.classList.add("hunt-on");
    toggleBtn.textContent = "🟢 Chasse activée";
  } else {
    toggleBtn.classList.remove("hunt-on");
    toggleBtn.classList.add("hunt-off");
    toggleBtn.textContent = "🔴 Chasse désactivée";
  }
}

function sendState() {
  chrome.runtime.sendMessage({
    action: "setHunt",
    value: huntActive
  })

  chrome.storage.local.set({ huntActive });
}

async function setBalls() {
  const pokeballs = await getPokeballs();
  const container = document.getElementById("ballList");

  for (const pokeball of pokeballs) {
    const ballCard = document.createElement("div");
    ballCard.classList.add("ball-card");
    ballCard.classList.add(`${pokeball.name}-icon`);
    const nbPerHours = 1 / pokeball.cooldown;
    ballCard.innerHTML = `
      <img class="ball-img" src="${pokeball.sprite}">
      <div class="ball-info">
        <div class="ball-name">${pokeball.name}</div>
        <div class="ball-count">${pokeball.quantity} / ${pokeball.max_stock}</div>
        <div class="ball-cooldown">+${nbPerHours.toFixed(2)} / heure</div>
        <div class="ball-time">${pokeball.remaining_time}</div>
      </div>
    `;

    container.appendChild(ballCard);
  }
}

document.getElementById('btn-settings').addEventListener('click', () => {
    // Redirige vers la page des paramètres (vérifie bien le nom de ton fichier)
    window.location.href = 'settings.html';
});


document.getElementById("btn-deconnection").addEventListener("click", async () => {
  const confirmation = confirm("⚠️ Es-tu sûr de vouloir te déconnecter ?");
    if (confirmation) {
      await deleteSettings();
      location.reload();
    }
});

const toggleBtn = document.getElementById("toggleHunt");
let huntActive = false;
const image = await getImageParam();
const username = await getUsernameParam();
const description = await getDescriptionParam();
const identifiant = await getIdentifiantParam();

// Vérification de la connexion
const logged = await isLoged(identifiant);
const isLogged = logged && logged.success === true;
if (!isLogged) {
  document.getElementById("pokedex").textContent = "Veuillez vous connecter depuis les paramètres";
} 
else {
  document.getElementById("name").textContent = "[" + username + "]";
  await setBalls();

  // restore state
  chrome.storage.local.get(["huntActive"], (res) => {
    huntActive = !!res.huntActive;
    updateUI();
  });

  toggleBtn.addEventListener("click", () => {
    huntActive = !huntActive;
    updateUI();
    sendState();
  });

  document.getElementById("pokedex").addEventListener("click", () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL("html/pokedex.html")
    });
  });

  document.getElementById("btn-encounters").addEventListener("click", () => {
      window.location.href = "encounterShow.html";
  });

  document.getElementById("btn-leaderboard").addEventListener("click", async () => {
    window.location.href = "leaderboard.html";
  });

}