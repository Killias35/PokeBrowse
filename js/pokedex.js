async function loadPokedex() {

  const container =
    document.getElementById("pokedex");

  for (let i = 1; i <= 151; i++) {

    const pokemon = await getPokemon(i);
    const card = document.createElement("div");

    card.innerHTML = `
      <img src="${pokemon.sprites}">
      <h3>#${pokemon.id} ${pokemon.name}</h3>
      <button data-id="${pokemon.id}">
        Détails
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