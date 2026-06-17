import { getUserByUsername, getAll } from "../API/users.js"; // Ajout de getAll
import { getLeaderboardUnique, getLeaderboardTotal, getLeaderboardShiny } from "../API/leaderboard.js";
import { DEFAULT_AVATAR, base_image } from "../settingsUtils.js";

const btnSearch = document.getElementById("btn-search-user");
const btnAllUsers = document.getElementById("btn-all-users"); // Nouveau bouton
const btnLeaderboard = document.getElementById("btn-leaderboard-unique");

const searchPanel = document.getElementById("search-panel");
const usersPanel = document.getElementById("users-panel"); // Nouveau panel
const leaderboardPanel = document.getElementById("leaderboard-panel");

/* =========================
   GESTION DES ONGLETS PRINCIPAUX
========================= */

btnSearch.addEventListener("click", () => showPanel("search"));
btnAllUsers.addEventListener("click", () => {
    showPanel("users");
    loadAllUsers(); // Charge la liste dès qu'on clique
});
btnLeaderboard.addEventListener("click", () => showPanel("leaderboard"));

function showPanel(type) {
    btnSearch.classList.toggle("active", type === "search");
    btnAllUsers.classList.toggle("active", type === "users");
    btnLeaderboard.classList.toggle("active", type === "leaderboard");

    searchPanel.classList.toggle("active", type === "search");
    usersPanel.classList.toggle("active", type === "users");
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

function nbValide(value) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return false;
  }

  const n = Number(value);

  return Number.isFinite(n) && n >= 0 && n <= 2000;
}

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
            if(!nbValide(user.image) || !user.image) user.image = DEFAULT_AVATAR;
            const dateCreation = new Date(user.created_at).toLocaleDateString('fr-FR');
            const avatarUrl = base_image + user.image + ".png";

            searchResult.innerHTML = `
                <div class="trainer-card">
                    <div class="trainer-avatar">
                        <img src="${avatarUrl}" alt="Avatar" class="avatar-img">
                    </div>
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
   FONCTION : TOUS LES UTILISATEURS
========================= */
const usersList = document.getElementById("users-list");

async function loadAllUsers() {
    usersList.innerHTML = `<div class="loading-msg">📡 Synchronisation du répertoire global...</div>`;

    try {
        const response = await getAll();
        // Sécurité au cas où l'API renvoie { success: true, users: [...] } ou directement [...]
        const users = Array.isArray(response) ? response : (response?.users || []);

        if (users && users.length > 0) {
            usersList.innerHTML = ""; // Clear loading

            users.forEach(user => {
                if(!nbValide(user.image) || !user.image) user.image = DEFAULT_AVATAR;
                const dateCreation = new Date(user.created_at).toLocaleDateString('fr-FR');
                const avatarUrl = base_image + user.image + ".png";

                const card = document.createElement("div");
                card.className = "us-card";

                card.innerHTML = `
                    <div class="lb-avatar-wrapper">
                        <img src="${avatarUrl}" alt="Avatar" class="lb-avatar-img">
                    </div>
                    <div class="us-info">
                        <span class="us-name">${user.username}</span>
                        <span class="us-joined">Membre depuis le ${dateCreation}</span>
                    </div>
                    <div class="us-arrow">SELECT ></div>
                `;

                // Clic sur un dresseur -> Ouvre sa fiche détaillée via ta fonction existante
                card.addEventListener("click", () => {
                    triggerSearchForUser(user.username);
                });

                usersList.appendChild(card);
            });
        } else {
            usersList.innerHTML = `<div class="error-msg">Aucun dresseur enregistré dans le système.</div>`;
        }
    } catch (error) {
        console.error("Erreur getAll users:", error);
        usersList.innerHTML = `<div class="error-msg">⚠️ Impossible de charger le répertoire de données.</div>`;
    }
}

/* =========================
   LEADERBOARD & SOUS-ONGLETS
========================= */

const lbSubBtns = document.querySelectorAll(".lb-sub-btn");
const leaderboardList = document.getElementById("leaderboard-list");

lbSubBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
        lbSubBtns.forEach(b => b.classList.remove("active"));
        e.target.classList.add("active");
        
        const type = e.target.getAttribute("data-type");
        loadLeaderboard(type);
    });
});

async function loadLeaderboard(type = "unique") {
    leaderboardList.innerHTML = `<div class="loading-msg">📡 Récupération des données réseau...</div>`;

    try {
        let response;
        if (type === "unique") response = await getLeaderboardUnique();
        else if (type === "total") response = await getLeaderboardTotal();
        else if (type === "shiny") response = await getLeaderboardShiny();

        if (response && response.success && response.leaderboard) {
            leaderboardList.innerHTML = "";

            response.leaderboard.forEach((user, index) => {
                if(!nbValide(user.image) || !user.image) user.image = DEFAULT_AVATAR;
                const rank = index + 1;
                let rankDisplay = `#${rank}`;
                
                if (rank === 1) rankDisplay = "🥇";
                if (rank === 2) rankDisplay = "🥈";
                if (rank === 3) rankDisplay = "🥉";

                const avatarUrl = base_image + user.image + ".png";

                const card = document.createElement("div");
                card.className = "lb-card clickable"; 
                
                card.innerHTML = `
                    <div class="lb-rank">${rankDisplay}</div>
                    <div class="lb-avatar-wrapper">
                        <img src="${avatarUrl}" alt="Avatar" class="lb-avatar-img">
                    </div>
                    <div class="lb-name">${user.username}</div>
                    <div class="lb-score">${user.score}</div>
                `;

                card.addEventListener("click", () => {
                    triggerSearchForUser(user.username);
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

function triggerSearchForUser(username) {
    showPanel("search");
    searchInput.value = username;
    onSearchUser();
}

// Initialisation au lancement
loadLeaderboard("unique");
showPanel("leaderboard");