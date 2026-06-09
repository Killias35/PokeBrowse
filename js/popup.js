import { getRemainingTime, getPokeballs } from "./pokeballs.js";
import { getBalls } from "./utils.js";

async function getDelaiFromLastSpawn() {
  const lastSpawn = await chrome.storage.local.get("lastSpawn");
  const lastSpawnTime = lastSpawn.lastSpawn || 0;
  const now = Date.now();
  const hours = (now - lastSpawnTime) / (60 * 60 * 1000);
  return hours;
}

async function setStatusBtnSpawn() {
  const hours = await getDelaiFromLastSpawn();
  const minutesLeft = (1 - hours) * 60;
  const btn = document.getElementById("spawn");
  if(hours >= 1){   // peut spawn
    btn.classList.remove("closed");
    btn.classList.add("primary")
    btn.textContent = `🎲 Faire apparaître un Pokémon`;
  }else{            // ne peut pas spawn
    btn.classList.remove("primary");
    btn.classList.add("closed");
    btn.textContent = `Apparition dans ${minutesLeft.toFixed(0)} minutes`;
  }
}

document.getElementById("spawn").addEventListener("click", async () => {
  const hours = await getDelaiFromLastSpawn();
  // if (hours <= 0) return; // DEBUG
  if (hours <= 0) return;

  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  chrome.tabs.sendMessage(tab.id, {
    action: "spawnPokemon"
  });

  await chrome.storage.local.set({
    lastSpawn: Date.now()
  });

  setStatusBtnSpawn();

});

document.getElementById("pokedex").addEventListener("click", () => {
  chrome.tabs.create({
    url: chrome.runtime.getURL("html/pokedex.html")
  });
});

const toggleBtn = document.getElementById("toggleHunt");
let huntActive = false;

// restore state
chrome.storage.local.get(["huntActive"], (res) => {
  huntActive = !!res.huntActive;
  updateUI();
});

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
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {
      action: "setHunt",
      value: huntActive
    });
  });

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
    const remainingTime = await getRemainingTime(pokeball);
    ballCard.innerHTML = `
      <img class="ball-img" src="../assets/balls/${pokeball.name}.png">
      <div class="ball-info">
        <div class="ball-name">${pokeball.name}</div>
        <div class="ball-count">${pokeball.count} / ${pokeball.maxCount}</div>
        <div class="ball-cooldown">+${nbPerHours.toFixed(2)} / heure</div>
        <div class="ball-time">${remainingTime}</div>
      </div>
    `;

    container.appendChild(ballCard);
  }
}


toggleBtn.addEventListener("click", () => {
  huntActive = !huntActive;
  updateUI();
  sendState();
});

await getBalls();
await setBalls();
await setStatusBtnSpawn();