import { playCry } from "./sound.js";

async function cryEffect(pokemon){
    playCry(pokemon);
    document.body.classList.add("screen-shake");
    setTimeout(() => {
        document.body.classList.remove("screen-shake");
    }, 500);
}

async function startEncounter(pokemon) {

    const shadow = document.getElementById("pokemon-shadow");
    const sprite = document.getElementById("pokemon-sprite");
    const flash = document.getElementById("encounter-effect");

    shadow.src = pokemon.sprites;
    sprite.src = pokemon.sprites;
    

    // temps pour admirer l'ombre
    await wait(500);

    // apparition de l'ombre
    shadow.classList.add("shadow-enter");

    // temps pour admirer l'ombre
    await wait(1000);

    // cri du Pokémon
    cryEffect(pokemon);

    // flash
    flash.classList.add("flash");

    // disparition de l'ombre
    shadow.style.opacity = "0";
    shadow.classList.remove("shadow-enter");

    // révélation du sprite
    sprite.classList.add("pokemon-reveal");
    sprite.classList.remove("pokemon-hide");

    await wait(450);

    sprite.classList.add("idle");
}

function wait(ms) {
  return new Promise(resolve =>
    setTimeout(resolve, ms)
  );
}

chrome.storage.local.get(["currentBattlePokemon"], async (result) => {
    const pokemon = result.currentBattlePokemon;
    if (!pokemon) return;
    await startEncounter(pokemon);
  }
);



