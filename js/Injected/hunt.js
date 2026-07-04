import { playCry } from "./sound.js";
import { getPokemon, getCurrentDomain } from "./utils.js";
import { injectPokemonStyles } from "./css/pokemons.js";
import { isCaptured } from "./pokedex.js";

// id (spawn id, pas pokemon_id) -> { wrapper, timeoutId, entry, info }
let spawned = {};
const domain_name = await getCurrentDomain();

injectPokemonStyles();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "spawnPokemon") {
    handleSpawnBatch(message.spawned);
  }
  return false;
});


/**
 * Traite un lot de spawns reçus du background : filtre ceux qui nous
 * concernent, puis affiche chaque nouveau pokemon.
 */
async function handleSpawnBatch(list) {
  if (document.visibilityState !== "visible") {
    // L'onglet n'est pas affiché, on attend le prochain lot.
    return;
  }

  for (const entry of list) {
    if (spawned[entry.id]) continue; // déjà affiché
    if (entry.domain_name !== domain_name) continue; // pas pour ce domaine
    if (new Date(entry.expires_at).getTime() <= Date.now()) continue; // déjà expiré

    await displayPokemon(entry);
  }
}

/**
 * Affiche un pokemon sauvage à partir d'un spawn serveur (entry) et des
 * infos statiques (nom, sprites) récupérées via getPokemon.
 */
async function displayPokemon(entry) {
  const info = await getPokemon(entry.pokemon_id);
  if (!info) return;

  const pokemon = {...info};

  const is_shiny = Boolean(entry.is_shiny);
  const is_captured = (await isCaptured(pokemon.id)) || false;

  pokemon.encounter_id = entry.id;
  pokemon.is_shiny = is_shiny;
  pokemon.is_captured = is_captured;

  const wrapper = document.createElement("div");
  wrapper.className = "wild-pokemon-wrapper";

  const img = document.createElement("img");
  img.className = "wild-pokemon-sprite" + (is_shiny ? " is-shiny" : "") + (is_captured ? " is-captured" : "");
  img.src = is_shiny ? info.shiny : info.sprites;
  img.alt = is_shiny ? `${info.name} (shiny)` : "???";

  const pageWidth = Math.max(
    document.body.scrollWidth,
    document.documentElement.scrollWidth
  );
  const pageHeight = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight
  );

  const x = Math.floor(Math.random() * Math.max(0, pageWidth - 120));
  const y = Math.floor(Math.random() * Math.max(0, pageHeight - 120));
  wrapper.style.left = `${x}px`;
  wrapper.style.top = `${y}px`;

  wrapper.appendChild(img);
  document.body.appendChild(wrapper);

  spawned[pokemon.encounter_id] = { wrapper, entry, info, timeoutId: null };

  playCry(info);

  // Disparition automatique à l'expiration du spawn (le pokemon s'enfuit)
  const msUntilExpire = new Date(entry.expires_at).getTime() - Date.now();
  spawned[pokemon.encounter_id].timeoutId = setTimeout(() => {
    despawnPokemon(pokemon.encounter_id, "fled");
  }, Math.max(msUntilExpire, 0));

  img.addEventListener("click", async () => {
    // Évite tout double-clic / capture en double
    img.style.pointerEvents = "none";

    chrome.runtime.sendMessage({
      action: "START_BATTLE",
      pokemon: pokemon,
    });

    window.open(chrome.runtime.getURL("html/battle.html"));

    despawnPokemon(pokemon.encounter_id, "captured");
  });

  console.log(`Un ${info.name ?? "Pokémon"} sauvage est apparu !`);
}


function despawnPokemon(id, reason = "fled") {
  const record = spawned[id];
  if (!record) return;

  clearTimeout(record.timeoutId);
  delete spawned[id];

  const { wrapper } = record;

  if (reason === "captured") {
    const sprite = wrapper.querySelector(".wild-pokemon-sprite");
    sprite?.classList.remove("is-shiny"); // évite tout conflit d'animation
    sprite?.classList.add("is-captured");
  }

  wrapper.classList.add(reason === "captured" ? "is-captured" : "is-fled");
  wrapper.addEventListener("animationend", () => wrapper.remove(), { once: true });
}

await chrome.runtime.sendMessage({ action: "getSpawnedPokemon" });
