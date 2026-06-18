import { API_BASE_URL } from "./app.js";

export async function register(username, identifiant, image, description) {
    try{
        const response = await fetch(`${API_BASE_URL}/users/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                image,
                username,
                description,
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

/* =========================
   GET USER BY ID
========================= */

export async function login(username, identifiant) {
    try{
        const response = await fetch(`${API_BASE_URL}/users/login`, {
            method: "POST",
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

export async function isLoged(username, identifiant) {
    console.log("trying to log in", username, identifiant);
    try{
        const response = await fetch(`${API_BASE_URL}/users/isLoged`, {
            method: "POST",
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

export async function getUserByUsername(username) {
    try{
        const response = await fetch(`${API_BASE_URL}/users/search/${username}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });
    
        const data = await response.json();
        const user = data.user;
        return user;
    }
    catch (error) {
        console.error(error);
    }
}

export async function updateUser(image, username, description, identifiant) {
    try{
        const response = await fetch(`${API_BASE_URL}/users/`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                image,
                username,
                identifiant,
                description
            })
        });
    
        const data = await response.json();
        return data;
    }
    catch (error) {
        console.error(error);
    }
}

export async function getAll() {
    try{
        const response = await fetch(`${API_BASE_URL}/users`, {
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
// console.log(await registerUser("kblebg", "je suis un super utilisateur", "test"));
// console.log(await getUserById(1));