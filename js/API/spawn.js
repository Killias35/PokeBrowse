import { API_BASE_URL } from "./app.js";


export async function getSpawned(username, identifiant, domainName) {
    try{
        const response = await fetch(`${API_BASE_URL}/encouters/spawned`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username,
                identifiant,
                domainName
            })
        });
    
        const data = await response.json();
        return data;
    }
    catch (error) {
        console.error(error);
        return {success: false, "spawned": []};
    }
}
