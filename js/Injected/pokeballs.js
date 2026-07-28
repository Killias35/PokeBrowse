import { show } from "../API/pokeballs.js";
import { getIdentifiantParam } from "../settingsUtils.js";

async function getPokeballs(training = false) {
    if (!training){
        const identifiant = await getIdentifiantParam();
        const result = await show(identifiant);
        if (!result.success)
            return [];
        else 
            return result.pokeballs;
    }
    else{   // pokeballs special pour le mode entrainement
        const pokeball = {
            name: "pokeball",
            quantity: 15,
            remaining_time: "---",
            ball_power: 1
        }
        const superball = {
            name: "superball",
            quantity: 5,
            remaining_time: "---",
            ball_power: 1.25
        }
        const hyperball = {
            name: "hyperball",
            quantity: 3,
            remaining_time: "---",
            ball_power: 1.5
        }
        const pokeballs = [pokeball, superball, hyperball];
        return pokeballs;
    }
}

export { getPokeballs };