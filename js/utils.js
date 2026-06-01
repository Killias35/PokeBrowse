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
    )
  };
}

function createPokemon(pokemon) {

  const img = document.createElement("img");

  img.src = pokemon.sprites;
  img.style.position = "fixed";
  img.style.right = "50px";
  img.style.bottom = "50px";
  img.style.width = "96px";
  img.style.zIndex = "999999";

  img.addEventListener("click", () => {

    capturePokemon(pokemon);

    img.remove();

    alert(`${pokemon.name} capturé !`);
  });

  document.body.appendChild(img);
  console.log(`${pokemon.name} apparaît ! Cliquez dessus pour le capturer !`);

}

async function capturePokemon(pokemon) {

  const result =
    await chrome.storage.local.get(
      "collection"
    );

  const collection =
    result.collection || [];

  collection.push({
    id: pokemon.id,
    name: pokemon.name,
    sprites: pokemon.sprites
  });

  await chrome.storage.local.set({
    collection
  });
}