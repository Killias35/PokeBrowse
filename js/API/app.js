import { capturePokemon } from "./capture.js";
import { getIdentifiantParam, getUsernameParam } from "../settingsUtils.js";

export const API_BASE_URL = "http://localhost:3000";


export async function capturePokemonAPI(pokemonId, isShiny, domainName){
    const username = await getUsernameParam();
    const identifiant = await getIdentifiantParam();
    const ret = await capturePokemon(username, identifiant, pokemonId, isShiny, domainName);
    return ret.success == true;
}