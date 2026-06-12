import { capturePokemon } from "./capture.js";
import { getIdentifiantParam } from "../settingsUtils.js";

export const API_BASE_URL = "http://localhost:3000";


export async function capturePokemonAPI(pokemonId, isShiny, domainName){
    const identifiant = await getIdentifiantParam();
    const ret = await capturePokemon(identifiant, pokemonId, isShiny, domainName);
    return ret.success == true;
}