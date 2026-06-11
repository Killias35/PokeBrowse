import { playCry } from "./sound.js";
import { getPokemon, capturePokemon, getSpawnsForDomain, getCurrentDomain } from "./utils.js";

const shinyChance = 0.005; // 0.5% de chance d'être shiny
const maxPokemon = 5;
let pokemonCount = 0;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "spawnPokemon") {
    spawnPokemon();
  }

  return false;
});

async function spawnPokemon() {
  if (document.visibilityState !== 'visible') {
        //nconsole.log("Le dresseur n'est pas sur la page. Spawn annulé.");
        return;
  }
  else if (pokemonCount >= maxPokemon) {
    // console.log("Trop de pokemon sur la page. Spawn annulé.");
    return;
  }
  const domaine = await getCurrentDomain();
  const pool = await getSpawnsForDomain(domaine);
  const pokemon = pool[Math.floor(Math.random() * pool.length)];
  pokemon.isShiny = Math.random() < shinyChance ? true : false;
  pokemon.domaine = domaine;
  pokemonCount++;
  
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
    pokemonCount--;
    chrome.runtime.sendMessage({
      action: "START_BATTLE",
      pokemon
    });

    window.open(
      chrome.runtime.getURL("html/battle.html")
    );
    img.remove();
  });

  document.body.appendChild(img);

  playCry(pokemon);
  console.log(`Un ${pokemon.name} sauvage est apparu !`);
}
