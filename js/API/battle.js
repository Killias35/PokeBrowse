import { API_BASE_URL } from "./app.js";


export async function startBattle(identifiant, spawn_pokemon_id) {
    try{
        const response = await fetch(`${API_BASE_URL}/battle`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                identifiant,
                spawn_pokemon_id
            })
        });
    
        const data = await response.json();
        return data;
    }
    catch (error) {
        console.error(error);
        return {success: false, "battle": {}};
    }
}

export async function getBattle(identifiant) {
    try{
        const response = await fetch(`${API_BASE_URL}/battle/show`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                identifiant
            })
        });
    
        const data = await response.json();
        return data;
    }
    catch (error) {
        console.error(error);
        return {success: false, "battle": {}};
    }
}

export async function capture(identifiant, score, pokeball_id) {
    try {
        const response = await fetch(`${API_BASE_URL}/battle/capture`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                identifiant,
                score,
                pokeball_id
            })
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
        return { success: false };
    }
}
