async function getPokedex() {
  const result = await chrome.storage.local.get("pokedex");

  const pokedex = result.pokedex || [];

  return pokedex;
}

async function loadPokedex() {

  const container = document.getElementById("pokedex");
  const pokedex = await getPokedex();
  pokedex.forEach((pokemon, i) => {
    const card = document.createElement("div");
    card.classList.add("pokemon-card");
    
    card.innerHTML = `
        <img src="${pokemon.sprites}" alt="${pokemon.name}">
        <h3>#${pokemon.id.toString().padStart(3, "0")} ${pokemon.name}</h3>
        <button data-id="${pokemon.id}">
            Voir les détails
        </button>
    `;

    card
      .querySelector("button")
      .addEventListener("click", () => {

        window.open(
          `https://pokeapi.co/api/v2/pokemon/${pokemon.id}`
        );
      });

    container.appendChild(card);
  })

    
}

loadPokedex();