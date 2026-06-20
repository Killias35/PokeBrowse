import { getUsernameParam, setUsernameParam, setIdentifiantParam, getImageParam, getDescriptionParam, getCollection, saveToApiParams } from "../settingsUtils.js";
import { getPokedex } from "./pokedex.js";
import { capturePokemonAPI } from "../API/app.js";

// pokeballs au demarrage
const POKEBALLS = [
  {
    name: "pokeball",
    maxCount: 15,
    count: 10,
    cooldown: 0.1667,
    lastUsed: Date.now(),
    power: 1
  },
  {
    name: "superball",
    maxCount: 5,
    count: 2,
    cooldown: 0.5,
    lastUsed: Date.now(), 
    power: 1.25
  },
  {
    name: "hyperball",
    maxCount: 3,
    count: 1,
    cooldown: 12,
    lastUsed: Date.now(),
    power: 1.5
  }
];

export async function getCurrentDomain() {
  const hostname = window.location.hostname;
  const domaine = hostname.replace("www.", "").replace("wwws.", "");
  return domaine;
}

async function loadSpawnConfig() {
  const url = chrome.runtime.getURL("assets/data/encounters.json");
  const response = await fetch(url);
  const config = await response.json();
  return config;
}

function getAllGaranteedSpawns() {
  const config = loadSpawnConfig();
  const garanteedSpawns = [];
  for (const spawns of Object.values(config)) {
    garanteedSpawns.push(...spawns);
  }
}

function domainToSeed(domain) {
  let hash = 5381;
  for (let i = 0; i < domain.length; i++) {
    hash = (hash * 33) ^ domain.charCodeAt(i);
  }
  return Math.abs(hash);
}

// PRNG déterministe (Mulberry32) — toujours la même séquence pour un seed donné
function createRng(seed) {
  let s = seed;
  return function () {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// recupere un pokemon
export async function getPokemon(id) {

  const pokemonRes = await fetch(
    `https://pokeapi.co/api/v2/pokemon/${id}`
  );

  const pokemon = await pokemonRes.json();
  const speciesRes = await fetch(
    pokemon.species.url
  );
  const species = await speciesRes.json();
  
  const frenchName =
  species.names.find(
    n => n.language.name === "fr"
  )?.name || pokemon.name;
  
  let stats = {}
  let sumSats = 0;
  let rarity = 'commun';
  for (const stat of pokemon.stats) {
    stats[stat.stat.name] = stat.base_stat;
    sumSats += stat.base_stat;
  }
  if (sumSats >= 580) rarity = 'legendary';
  else if (sumSats >= 500) rarity = 'epic';
  else if (sumSats >= 400) rarity = 'rare';

  return {
    id: pokemon.id,
    name: frenchName,
    sprites: pokemon.sprites.front_default,
    shiny: pokemon.sprites.front_shiny,
    height: pokemon.height,
    weight: pokemon.weight,
    types: pokemon.types.map(
      t => t.type.name
    ),
    stats: stats,
    rarity: rarity,
    cry: pokemon.cries?.latest || pokemon.cries?.legacy || null
  };
}

// capture un pokemon
export async function capturePokemon(pokemon) {
  await capturePokemonAPI(pokemon.id, pokemon.isShiny, pokemon.domaine);
  await getCollection();
}

// charge le pokedex dans le storage
export async function setPokedex() {
  const pokedex = await getPokedex();

  if (pokedex.length === 0) {
    let pokedex = [];
    for (let i = 1; i <= 151; i++) {
      const pokemon = await getPokemon(i);
      pokedex.push(pokemon);
    }
    await chrome.storage.local.set({pokedex});
  }

  return pokedex;
}

// charge les pokeballs dans le storage
export async function getBalls() {

  const result = await chrome.storage.local.get("pokeballs");

  const pokeballs = result.pokeballs || [];

  if (pokeballs.length === 0) { // si pas de pokeballs dans le storage
    pokeballs.push(...POKEBALLS);
    await chrome.storage.local.set({pokeballs});
  }
  else{ // verification données correctes
    let valide = true;
    for (let i = 0; i < POKEBALLS.length; i++) {
      const pokeball = pokeballs[i];
      const pokeballBase = POKEBALLS[i]

      if(!pokeball || !pokeballBase) {
        valide = false;
        break;
      }
      if(pokeball.maxCount > pokeballBase.maxCount) {
        valide = false;
        pokeball.maxCount = pokeballBase.maxCount;
        pokeball.count = 0;
      }
      if(pokeball.power !== pokeballBase.power ) {
        valide = false;
        pokeball.power = pokeballBase.power;
      }
      if(pokeball.cooldown !== pokeballBase.cooldown) {
        valide = false;
        pokeball.cooldown = pokeballBase.cooldown;
        pokeball.count = 0;
      }
      pokeballs[i] = pokeball;
    }
    if (valide == false) {
      console.log("Pokeballs non valides, valeurs par defauts appliquées.");
      await chrome.storage.local.set({pokeballs});
    }

  }
}

export async function getSpawnsForDomain(domain) {
  const encoutersTable = await loadSpawnConfig();
  const pokedex = await setPokedex();
  const seed = domainToSeed(domain);
  const rng = createRng(seed);

  // Nombre de spawns entre 10 et 20
  const spawnCount = 10 + (seed % 11);

  // Pokémon garantis pour ce domaine
  const guaranteed = encoutersTable[domain] ?? [];

  // Tous les Pokémon garantis de tous les domaines
  const excludedIds = new Set();

  for (const ids of Object.values(encoutersTable)) {
    for (const id of ids) {
      excludedIds.add(id);
    }
  }

  // Pool de base sans aucun Pokémon garanti
  const basePool = [];

  for (let i = 1; i <= pokedex.length; i++) {
    if (!excludedIds.has(i)) {
      basePool.push(i);
    }
  }

  // Shuffle Fisher-Yates déterministe
  for (let i = basePool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [basePool[i], basePool[j]] = [basePool[j], basePool[i]];
  }

  const needed = Math.max(0, spawnCount - guaranteed.length);
  const picked = basePool.slice(0, needed);

  // Ajout des garantis du domaine
  const ids = [...new Set([...guaranteed, ...picked])];

  return ids.map(id => ({
    ...pokedex[id - 1],
    isGuaranteed: guaranteed.includes(id)
  }));
}

async function init() {
  const loading = document.getElementById("loading-indicator")
  if(loading) loading.classList.remove("hidden");
  await setPokedex();
  await getBalls();
  if(loading) loading.classList.add("hidden");
}

await init();