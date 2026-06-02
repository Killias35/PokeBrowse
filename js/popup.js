document.getElementById("spawn").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  chrome.tabs.sendMessage(tab.id, {
    action: "spawnPokemon"
  });
});

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

toggleBtn.addEventListener("click", () => {
  huntActive = !huntActive;
  updateUI();
  sendState();
});