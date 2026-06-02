document
.getElementById("spawn")
.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  chrome.tabs.sendMessage(tab.id, {
    action: "spawnPokemon"
  });
});

document
.getElementById("collection")
.addEventListener("click", () => {
  chrome.tabs.create({
    url: chrome.runtime.getURL("html/collection.html")
  });
});

document
.getElementById("pokedex")
.addEventListener("click", () => {
  chrome.tabs.create({
    url: chrome.runtime.getURL("html/pokedex.html")
  });
});

document
.getElementById("activeHunt")
.addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: "activeHunt", value: true });
  });
});

document
.getElementById("stopHunt")
.addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: "activeHunt", value: false });
  });
});