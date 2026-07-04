import { show } from "../API/pokeballs.js";
import { getIdentifiantParam } from "../settingsUtils.js";

async function getPokeballs() {
    const identifiant = await getIdentifiantParam();
    const result = await show(identifiant);
    if (!result.success)
        return [];
    else 
        return result.pokeballs;
}

export { getPokeballs };