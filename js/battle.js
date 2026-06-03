import { startEncounter } from "./battle-annimation.js";

chrome.storage.local.get(["currentBattlePokemon"], async (result) => {
    const pokemon = result.currentBattlePokemon;
    if (!pokemon) return;

    await startEncounter(pokemon);
    console.log("pret pour combat !");
});