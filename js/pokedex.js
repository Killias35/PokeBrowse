import { getPokemon } from "./utils.js";

async function loadPokedex() {

  const container =
    document.getElementById("pokedex");

  for (let i = 1; i <= 151; i++) {

    const pokemon = await getPokemon(i);
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
  }
}

loadPokedex();