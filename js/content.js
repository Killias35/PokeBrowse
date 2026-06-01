chrome.runtime.onMessage.addListener(
  async (message) => {

    if (message.action !== "spawnPokemon")
      return;

    const randomId =
      Math.floor(Math.random() * 151) + 1;

    console.log(`Spawning Pokémon #${randomId}`);
    const pokemon = await getPokemon(randomId);
    console.log(`Pokémon #${randomId} apparaît ! Cliquez dessus pour le capturer !`);

    createPokemon(pokemon);
  }
);

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