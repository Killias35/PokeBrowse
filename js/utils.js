// tourne avec content.js

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

getPokedex();