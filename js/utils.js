
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

  await chrome.storage.local.set({
    collection
  });
}

// charge le pokedex dans le storage
async function getPokedex() {

  const result = await chrome.storage.local.get("pokedex");

  const pokedex = result.pokedex || [];

  if (pokedex.length === 0) {
    let pokedex = [];
    for (let i = 1; i <= 151; i++) {

      const pokemon = await getPokemon(i);

      pokedex.push(pokemon);
    }
    await chrome.storage.local.set({pokedex});
  }
}

// charge les pokeballs dans le storage
async function getBalls() {

  const result = await chrome.storage.local.get("pokeballs");

  const pokeballs = result.pokeballs || [];

  if (pokeballs.length === 0) {
    pokeballs.push(...POKEBALLS);
    await chrome.storage.local.set({pokeballs});
  }
}

getPokedex();
getBalls();