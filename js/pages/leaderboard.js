import { getUserByUsername } from "../API/users.js";
import { getLeaderboardUnique, getLeaderboardTotal, getLeaderboardShiny } from "../API/leaderboard.js";

const btnSearch = document.getElementById("btn-search-user");
const btnLeaderboard = document.getElementById("btn-leaderboard-unique"); // Note : tu peux le renommer btn-leaderboard tout court dans le HTML si tu veux

const searchPanel = document.getElementById("search-panel");
const leaderboardPanel = document.getElementById("leaderboard-panel");

/* =========================
   GESTION DES ONGLETS PRINCIPAUX
========================= */

btnSearch.addEventListener("click", () => showPanel("search"));
btnLeaderboard.addEventListener("click", () => showPanel("leaderboard"));

function showPanel(type) {
    btnSearch.classList.toggle("active", type === "search");
    btnLeaderboard.classList.toggle("active", type === "leaderboard");

    searchPanel.classList.toggle("active", type === "search");
    leaderboardPanel.classList.toggle("active", type === "leaderboard");
}

/* =========================
   SEARCH USER
========================= */

const searchInput = document.getElementById("search-input");
const searchSubmit = document.getElementById("search-submit");
const searchResult = document.getElementById("search-result");

searchSubmit.addEventListener("click", onSearchUser);

searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") onSearchUser();
});

async function onSearchUser() {
    const username = searchInput.value.trim();

    if (!username) {
        searchResult.innerHTML = `<div class="error-msg">Veuillez entrer un nom de dresseur !</div>`;
        return;
    }

    searchResult.innerHTML = `<div class="loading-msg">⏳ Recherche dans la base de données...</div>`;

    try {
        const user = await getUserByUsername(username);

        if (user && user.username) {
            const dateCreation = new Date(user.created_at).toLocaleDateString('fr-FR');
            searchResult.innerHTML = `
                <div class="trainer-card">
                    <div class="trainer-avatar">🧑‍🚀</div>
                    <div class="trainer-info">
                        <h3>${user.username} <span class="trainer-id">#${user.id}</span></h3>
                        <p class="trainer-desc">"${user.description || "Aucune description"}"</p>
                        <div class="trainer-stats">
                            <span>📅 Inscrit le : ${dateCreation}</span>
                        </div>
                    </div>
                </div>
            `;
        } else {
            searchResult.innerHTML = `<div class="error-msg">❌ Aucun dresseur trouvé sous le nom "${username}".</div>`;
        }
    } catch (error) {
        console.error("Erreur de recherche :", error);
        searchResult.innerHTML = `<div class="error-msg">⚠️ Erreur de connexion au réseau PC.</div>`;
    }
}

/* =========================
   LEADERBOARD & SOUS-ONGLETS
========================= */

const lbSubBtns = document.querySelectorAll(".lb-sub-btn");
const leaderboardList = document.getElementById("leaderboard-list");

// Écouteurs pour les sous-onglets (Unique, Total, Shiny)
lbSubBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
        // Gérer le style visuel des boutons
        lbSubBtns.forEach(b => b.classList.remove("active"));
        e.target.classList.add("active");
        
        // Charger le bon leaderboard
        const type = e.target.getAttribute("data-type");
        loadLeaderboard(type);
    });
});

async function loadLeaderboard(type = "unique") {
    leaderboardList.innerHTML = `<div class="loading-msg">📡 Récupération des données réseau...</div>`;

    try {
        let response;
        
        // Appel à la bonne fonction selon l'onglet
        if (type === "unique") response = await getLeaderboardUnique();
        else if (type === "total") response = await getLeaderboardTotal();
        else if (type === "shiny") response = await getLeaderboardShiny();

        if (response && response.success && response.leaderboard) {
            leaderboardList.innerHTML = ""; // Vider le chargement

            response.leaderboard.forEach((player, index) => {
                const rank = index + 1;
                let rankDisplay = `#${rank}`;
                
                // Médailles pour le Top 3
                if (rank === 1) rankDisplay = "🥇";
                if (rank === 2) rankDisplay = "🥈";
                if (rank === 3) rankDisplay = "🥉";

                // Création de la carte
                const card = document.createElement("div");
                card.className = "lb-card clickable"; // Ajout de 'clickable' pour le CSS
                
                card.innerHTML = `
                    <div class="lb-rank">${rankDisplay}</div>
                    <div class="lb-name">${player.username}</div>
                    <div class="lb-score">${player.score}</div>
                `;

                // ✨ Fonctionnalité magique : Redirection vers la recherche
                card.addEventListener("click", () => {
                    triggerSearchForUser(player.username);
                });

                leaderboardList.appendChild(card);
            });
        } else {
            leaderboardList.innerHTML = `<div class="error-msg">Aucune donnée trouvée pour ce classement.</div>`;
        }
    } catch (error) {
        console.error("Erreur Leaderboard:", error);
        leaderboardList.innerHTML = `<div class="error-msg">⚠️ Erreur de connexion aux serveurs.</div>`;
    }
}

// Fonction pour automatiser la recherche au clic
function triggerSearchForUser(username) {
    showPanel("search"); // Basculer sur l'onglet recherche
    searchInput.value = username; // Remplir l'input
    onSearchUser(); // Lancer la recherche automatiquement
}

// Initialisation au lancement
loadLeaderboard("unique");
showPanel("leaderboard");