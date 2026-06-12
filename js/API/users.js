import { API_BASE_URL } from "./app.js";

/* =========================
   REGISTER USER
========================= */

export async function tryRegister(image, username, description, identifiant) {
    console.log("tryRegister", image, username, description, identifiant);
    const user = await getUserByIdentifiant(identifiant);
    if (user !== undefined) return false;
    await registerUser(image, username, description, identifiant);
    return true;
}

export async function registerUser(image, username, description, identifiant) {
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
    }
}

/* =========================
   GET USER BY ID
========================= */

export async function getUserByIdentifiant(identifiant) {
    try{
        const response = await fetch(`${API_BASE_URL}/users/login`, {
            method: "GET",
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
        // console.error(error);
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
        const response = await fetch(`${API_BASE_URL}/users/${identifiant}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                image,
                username,
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