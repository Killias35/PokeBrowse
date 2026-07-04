import { API_BASE_URL } from "./app.js";

export async function freePokemonsAPI(username, identifiant) {
    try{
        const response = await fetch(`${API_BASE_URL}/pokemon/free/`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username,
                identifiant
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

export async function getCaptures(username){
    try{
        const response = await fetch(`${API_BASE_URL}/pokemon/capture/${username}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });
    
        const data = await response.json();
        return data;
    }
    catch (error) {
        // console.error(error);
        return {success: false, message: error.message};
    }
}
