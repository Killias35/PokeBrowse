
const btnSearch = document.getElementById("btn-search-user");
const btnLeaderboard = document.getElementById("btn-leaderboard-unique");

const searchPanel = document.getElementById("search-panel");
const leaderboardPanel = document.getElementById("leaderboard-panel");

btnSearch.addEventListener("click", () => {
    showPanel("search");
});

btnLeaderboard.addEventListener("click", () => {
    showPanel("leaderboard");
});

function showPanel(type) {
    // TODO
}

/* =========================
   SEARCH USER
========================= */

const searchInput = document.getElementById("search-input");
const searchSubmit = document.getElementById("search-submit");

searchSubmit.addEventListener("click", () => {
    onSearchUser();
});

async function onSearchUser() {
    // TODO
}

/* =========================
   LEADERBOARD
========================= */

async function loadLeaderboard() {
    // TODO
}

loadLeaderboard();