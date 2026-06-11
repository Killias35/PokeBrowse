import { API_BASE_URL } from "./app.js";

export async function getLeaderboardUnique() {
    try{
        const response = await fetch(`${API_BASE_URL}/leaderboard1`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });
    
        const data = await response.json();
        return data;
    }
    catch (error) {
        console.error(error);
    }
}

export async function getLeaderboardTotal() {
    try{
        const response = await fetch(`${API_BASE_URL}/leaderboard2`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });
    
        const data = await response.json();
        return data;
    }
    catch (error) {
        console.error(error);
    }
}

export async function getLeaderboardShiny() {
    try{
        const response = await fetch(`${API_BASE_URL}/leaderboard3`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });
    
        const data = await response.json();
        return data;
    }
    catch (error) {
        console.error(error);
    }
}