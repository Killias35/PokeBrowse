import { API_BASE_URL } from "./app.js";


export async function show(identifiant) {
    try{
        const response = await fetch(`${API_BASE_URL}/pokeballs/show`, {
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
        return {success: false};
    }
}
