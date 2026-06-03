import { playCry, startHuntMusic, stopHuntMusic } from "./sound.js";
import { getPokemon } from "./utils.js";

let setHunt = false;
let huntMusic = null;
let maxPokemon = 3;
let currentPokemonCount = 0;

chrome.runtime.onMessage.addListener(
  async (message) => {
    if (message.action == "spawnPokemon")
      await spawnPokemon();
  }
);

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "setHunt") {
    setHunt = msg.value;// déblocage audio
    const unlock = new Audio();
    unlock.volume = 0;
    unlock.play().catch(() => {});

    if (setHunt) {
      startHuntMusic();
    } else {
      stopHuntMusic();
    }
  }
});

async function spawnPokemon() {
  const randomId = Math.floor(Math.random() * 151) + 1;
  const pokemon = await getPokemon(randomId);

  const img = document.createElement("img");

  const pageWidth = Math.max(
    document.body.scrollWidth,
    document.documentElement.scrollWidth
  );

  const pageHeight = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight
  );

  const x = Math.floor(Math.random() * (pageWidth - 100));
  const y = Math.floor(Math.random() * (pageHeight - 100));

  img.src = pokemon.sprites;

  img.style.position = "absolute";
  img.style.left = `${x}px`;
  img.style.top = `${y}px`;

  img.style.width = "96px";
  img.style.zIndex = "999999";
  img.style.cursor = "pointer";

  img.style.transition = "transform 0.2s ease";

  img.addEventListener("mouseenter", () => {  // annimation
    img.style.transform = "scale(1.2)";
  });

  img.addEventListener("mouseleave", () => {  // annimation
    img.style.transform = "scale(1)";
  });

  img.addEventListener("click", async () => { // capture
    await chrome.storage.local.set({
      currentBattlePokemon: pokemon
    });

    window.open(
      chrome.runtime.getURL("html/battle.html")
    );
    img.remove();
    currentPokemonCount--;
  });

  document.body.appendChild(img);

  playCry(pokemon);
  console.log(`Un ${pokemon.name} sauvage est apparu !`);
}

function loop() {                               // spawn moyen: 6 pkmn / heure
  const delay = Math.random() * 300000 + 60000; // entre 1 minute et 6 minutes

  setTimeout(async () => {
    if (Math.random() < 0.35 && setHunt && currentPokemonCount < maxPokemon) {                 // 35% de chance
      await spawnPokemon();
      currentPokemonCount++;
    }
    loop();
  }, delay);
}

loop();