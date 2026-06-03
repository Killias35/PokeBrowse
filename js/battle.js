import { playCry } from "./sound.js";

chrome.storage.local.get(["currentBattlePokemon"],(result) => {
    const pokemon = result.currentBattlePokemon;
    if (!pokemon) return;

    document.getElementById("pokemon-sprite").src = pokemon.sprites;
    document.getElementById("pokemon-name").textContent = pokemon.name;

    playCry(pokemon);
  }
);