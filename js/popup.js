import { getRemainingTime } from "./pokeballs.js";

document.getElementById("collection").addEventListener("click", () => {
  chrome.tabs.create({
    url: chrome.runtime.getURL("html/collection.html")
  });
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
  const result = await chrome.storage.local.get(["pokeballs"]);
  const container = document.getElementById("ballList");

  for (const pokeball of result.pokeballs) {
    const ballCard = document.createElement("div");
    ballCard.classList.add("ball-card");
    ballCard.classList.add(`${pokeball.name}-icon`);
    const nbPerHours = 1 / pokeball.cooldown;
    const remainingTime = await getRemainingTime(pokeball);
    ballCard.innerHTML = `
      <img class="ball-img" src="../assets/balls/${pokeball.name}.png">
      <div class="ball-info">
        <div class="ball-name">${pokeball.name}</div>
        <div class="ball-count">${pokeball.count} / ${pokeball.capacity}</div>
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

await setBalls();