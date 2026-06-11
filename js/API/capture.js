import { API_BASE_URL } from "./app.js";

export async function capturePokemon(identifiant, pokemonId, isShiny, domainName) {
    try{
        const response = await fetch(`${API_BASE_URL}/pokemon/capture`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                identifiant,
                pokemonId,
                isShiny,
                domainName
            })
        });
    
        const data = await response.json();
        return data;
    }
    catch (error) {
        // console.error(error);
        return {success: false};
    }
}