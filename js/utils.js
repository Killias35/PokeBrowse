// tourne avec content.js

// pokeballs au demarrage
const POKEBALLS = [
  {
    name: "pokeball",
    capacity: 15,
    count: 10,
    cooldown: 0.1667,
    lastUsed: Date.now()
    
  },
  {
    name: "superball",
    capacity: 5,
    count: 2,
    cooldown: 0.5,
    lastUsed: Date.now()
  },
  {
    name: "hyperball",
    capacity: 3,
    count: 1,
    cooldown: 12,
    lastUsed: Date.now()
  }
];

async function getPokemon(id) {

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
  
  return {
    id: pokemon.id,
    name: frenchName,
    sprites: pokemon.sprites.front_default,
    height: pokemon.height,
    weight: pokemon.weight,
    types: pokemon.types.map(
      t => t.type.name
    ),
    cry: pokemon.cries?.latest || pokemon.cries?.legacy || null
  };
}

async function capturePokemon(pokemon) {

  const result = await chrome.storage.local.get("collection");

  const collection = result.collection || [];

  collection.push(pokemon);

  await chrome.storage.local.set({
    collection
  });
}


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