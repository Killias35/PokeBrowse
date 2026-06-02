async function loadPokemons() {
  const result =
    await chrome.storage.local.get(
      "collection"
    );

  const pokemons = result.collection || [];
  let data = {};
  pokemons.forEach((pokemon) => {
    if (!data[pokemon.id]) { 
      pokemon.captured = 1;
      data[pokemon.id] = pokemon;
    }
    else {data[pokemon.id].captured++;}
  })
  return data;
}

const POKEMONS = await loadPokemons();

async function load() {
  const list = document.getElementById("list");
  const nbPokemons = document.getElementById("nb-pokemons-badge");
  nbPokemons.textContent = Object.keys(POKEMONS).length;
  
  Object.keys(POKEMONS).forEach(id => {
    const pokemon = POKEMONS[id];

    const div = document.createElement("div");
    div.classList.add("pokemon-card");
    div.innerHTML = `
      <img src="${pokemon.sprites}" alt="${pokemon.name}">

      <h3>#${pokemon.id.toString().padStart(3, "0")} ${pokemon.name}</h3>

      <div class="capture-count">
          Capturé x ${pokemon.captured}
      </div>
    `;

    list.appendChild(div);
  })
}

async function resetCollection() {

  await chrome.storage.local.set({
    collection: []
  });

  alert("Toutes les Pokémon ont été libérée !");

  location.reload();
}

load();

document
  .getElementById("reset-collection")
  .addEventListener("click", resetCollection);