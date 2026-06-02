async function getPokedex() {
  const result = await chrome.storage.local.get("pokedex");

  const pokedex = result.pokedex || [];

  return pokedex;
}

function updateBadge(percent) {
    const badge = document.getElementById("nb-pokemons-badge");

    badge.textContent = percent.toString().slice(0, 3) + "%";

    const level = Math.min(100, Math.floor(percent / 10) * 10);
    badge.classList.add(`badge-${level}`);
}

async function loadPokemons() {
  const result =
    await chrome.storage.local.get(
      "collection"
    );

  const pokemons = result.collection || [];
  let data = {};
  // obtient aussi le nombre de fois que le pokemon a ete capturer
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
const POKEDEX  = await getPokedex();

async function load() {
  const list = document.getElementById("list");
  const nbPokemons = document.getElementById("nb-pokemons-badge");
  const captured = Object.keys(POKEMONS).length;
  const completion = (Math.floor((captured / POKEDEX.length) * 1000) * 0.1);
  updateBadge(completion);
  
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
document.getElementById("reset-collection").addEventListener("click", resetCollection);