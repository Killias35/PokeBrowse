import { getUserByUsername } from "../API/users.js";

const btnSearch = document.getElementById("btn-search-user");
const btnLeaderboard = document.getElementById("btn-leaderboard-unique");

const searchPanel = document.getElementById("search-panel");
const leaderboardPanel = document.getElementById("leaderboard-panel");

// Écouteurs d'événements pour les onglets
btnSearch.addEventListener("click", () => {
    showPanel("search");
});

btnLeaderboard.addEventListener("click", () => {
    showPanel("leaderboard");
});

// Fonction pour gérer l'affichage des onglets
function showPanel(type) {
    // Gestion des boutons
    btnSearch.classList.toggle("active", type === "search");
    btnLeaderboard.classList.toggle("active", type === "leaderboard");

    // Gestion des panneaux (on retire "hidden" et on utilise "active")
    searchPanel.classList.toggle("active", type === "search");
    leaderboardPanel.classList.toggle("active", type === "leaderboard");
}

/* =========================
   SEARCH USER
========================= */

const searchInput = document.getElementById("search-input");
const searchSubmit = document.getElementById("search-submit");
const searchResult = document.getElementById("search-result");

searchSubmit.addEventListener("click", () => {
    onSearchUser();
});

// Permet aussi de rechercher en appuyant sur "Entrée"
searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        onSearchUser();
    }
});

async function onSearchUser() {
    const username = searchInput.value.trim();

    if (!username) {
        searchResult.innerHTML = `<div class="error-msg">Veuillez entrer un nom de dresseur !</div>`;
        return;
    }

    // Message d'attente stylisé
    searchResult.innerHTML = `<div class="loading-msg">⏳ Recherche dans la base de données de Léo...</div>`;

    try {
        const user = await getUserByUsername(username);

        if (user && user.username) {
            // Formater la date proprement (ex: 11/06/2026)
            const dateCreation = new Date(user.created_at).toLocaleDateString('fr-FR');

            // Affichage de la carte dresseur
            searchResult.innerHTML = `
                <div class="trainer-card">
                    <div class="trainer-avatar">🧑‍🚀</div>
                    <div class="trainer-info">
                        <h3>${user.username} <span class="trainer-id">#${user.id}</span></h3>
                        <p class="trainer-desc">"${user.description || "Aucune description"}"</p>
                        <div class="trainer-stats">
                            <span>📅 Inscrit le : ${dateCreation}</span>
                            <span>🆔 ID : ${user.identifiant}</span>
                        </div>
                    </div>
                </div>
            `;
        } else {
            searchResult.innerHTML = `<div class="error-msg">❌ Aucun dresseur trouvé sous le nom "${username}".</div>`;
        }
    } catch (error) {
        console.error("Erreur de recherche :", error);
        searchResult.innerHTML = `<div class="error-msg">⚠️ Erreur de connexion au PC réseau.</div>`;
    }
}

/* =========================
   LEADERBOARD
========================= */

async function loadLeaderboard() {
    // TODO: À compléter quand tu auras ta fonction API pour le classement global.
    // En attendant, on peut mettre un message par défaut.
    const leaderboardList = document.getElementById("leaderboard-list");
    if(leaderboardList.innerHTML === "") {
        leaderboardList.innerHTML = `<div class="loading-msg">Chargement du classement mondial...</div>`;
    }
}

// Initialisation au lancement
loadLeaderboard();
// Afficher le panneau du leaderboard par défaut (vu qu'il a la classe active dans ton HTML)
showPanel("leaderboard");