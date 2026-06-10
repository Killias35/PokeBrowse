import { playCry, startMusic, stopMusic } from "./sound.js";
import { getPokemon, capturePokemon } from "./utils.js";

async function getHunt() {
  const result = await chrome.storage.local.get("huntActive");
  return result.huntActive || false;
}

let setHunt = await getHunt();
const maxPokemon = 3;
let currentPokemonCount = 0;
const shinyChance = 0.005; // 0.5% de chance d'être shiny
const MaxTimeBeforeSpawn = 10 * 60 * 1000;  // 10 minutes

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
      startMusic("hunt");
    } else {
      stopMusic();
    }
  }
});

async function spawnPokemon() {
  const randomId = Math.floor(Math.random() * 151) + 1;
  const pokemon = await getPokemon(randomId);
  pokemon.isShiny = Math.random() < shinyChance ? true : false;
  
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

  img.src = pokemon.isShiny ? pokemon.shiny : pokemon.sprites;

  img.style.position = "absolute";
  img.style.left = `${x}px`;
  img.style.top = `${y}px`;
  img.style.filter = "brightness(0)";

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

    stopMusic();

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

function loop() {                               // spawn moyen: 5 minutes
  const delay = Math.random() * MaxTimeBeforeSpawn; // en ms

  setTimeout(async () => {
    if (setHunt && currentPokemonCount < maxPokemon) {
      await spawnPokemon();
      currentPokemonCount++;
    }
    loop();
  }, delay);
}

loop();