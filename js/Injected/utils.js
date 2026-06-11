import { getUsernameParam, setUsernameParam } from "../settingsUtils.js";
import { getPokedex } from "./pokedex.js";

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
    power: 1.12
  },
  {
    name: "hyperball",
    maxCount: 3,
    count: 1,
    cooldown: 12,
    lastUsed: Date.now(),
    power: 1.25
  }
];

export async function getCurrentDomain() {
  return window.location.hostname;
}

export async function getCurrentDomainFromTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if(tab.url.startsWith("chrome-extension://")) return null;
  const hostname = new URL(tab.url).hostname;
  const domaine = hostname.replace("www.", "");
  return domaine;
}

async function loadSpawnConfig() {
  const url = chrome.runtime.getURL("assets/data/encounters.json");
  const response = await fetch(url);
  const config = await response.json();
  return config;
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

  const result = await chrome.storage.local.get("collection");

  const collection = result.collection || [];

  collection.push(pokemon);

  await chrome.storage.local.set({collection});
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
  const rng  = createRng(seed);

  // Nombre de spawns entre 10 et 20, fixe pour ce domaine
  const spawnCount = 10 + (seed % 11); // 10 + (0..10) = 10..20

  const guaranteed = encoutersTable[domain] ?? [];

  const basePool = [];
  for (let i = 1; i <= pokedex.length; i++) {
    if (!guaranteed.includes(i)) basePool.push(i);
  }

  // Shuffle du pool avec le RNG déterministe (Fisher-Yates)
  for (let i = basePool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [basePool[i], basePool[j]] = [basePool[j], basePool[i]];
  }

  // On prend les N premiers du pool mélangé, puis on ajoute les garantis
  const needed = Math.max(0, spawnCount - guaranteed.length);
  const picked  = basePool.slice(0, needed);

  // Les garantis sont toujours présents, peu importe spawnCount
  const ids = [...new Set([...guaranteed, ...picked])];
  const pokemonds = [];
  for(const id of ids) {
    const pokemon = pokedex[id - 1];
    for(const g of guaranteed) {
      if (g === id) {
        pokemon.isGuaranteed = true;
        break;
      }
    }
    pokemonds.push(pokemon);
  }
  return pokemonds;
}

setPokedex();
getBalls();
if (getUsernameParam() === "Dresseur") setUsernameParam("User" + Math.floor(Math.random() * 10000));