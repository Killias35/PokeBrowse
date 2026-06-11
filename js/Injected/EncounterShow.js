import { getPokemon, setPokedex, getSpawnsForDomain, getCurrentDomainFromTab } from "./utils.js";
import { isCaptured } from "./pokedex.js";

function buildCard(pokemon, isGuaranteed, unlocked) {
    const card = document.createElement("div");
    card.className = `enc-card${unlocked ? "" : " locked"}`;

    // Point doré pour les garantis
    if (isGuaranteed) {
        const dot = document.createElement("div");
        dot.className = "enc-guaranteed-dot";
        dot.title = "Garanti sur ce domaine";
        card.appendChild(dot);
    }

    const img = document.createElement("img");
    img.className = "enc-sprite";
    img.src = pokemon.sprites;
    img.alt = unlocked ? pokemon.name : "???";
    img.loading = "lazy";

    const name = document.createElement("div");
    name.className = "enc-name";
    name.textContent = unlocked ? pokemon.name : "???";

    const id = document.createElement("div");
    id.className = "enc-id";
    id.textContent = `#${String(pokemon.id).padStart(3, "0")}`;

    card.appendChild(img);
    card.appendChild(name);
    card.appendChild(id);

    return card;
}

// ─── Rendu principal ───────────────────────────────────────────────────────

async function render() {
    const container = document.getElementById("encounter-content");
    const domainLabel = document.getElementById("domain-label");

    // 1. Domaine courant
    const domain = await getCurrentDomainFromTab();
    domainLabel.textContent = domain ?? "inconnu";

    if (!domain) {
        container.innerHTML = `<p style="text-align:center;color:#64748b;padding:20px 0;font-size:0.85rem;">
            Impossible de détecter le domaine.
        </p>`;
        return;
    }

    const pokemons = new Set(await getSpawnsForDomain(domain) ?? []);

    // 4. Construction du DOM
    container.innerHTML = `
        <div class="encounter-scroll">
            <div class="encounter-grid" id="enc-grid"></div>
        </div>
        <div class="encounter-legend">
            <div class="legend-dot"></div>
            <span>Garanti sur ce domaine</span>
        </div>
    `;

    const grid = document.getElementById("enc-grid");
    for (const pokemon of pokemons) {
        const unlocked = await isCaptured(pokemon.id);
        const isGuaranteed = pokemon.isGuaranteed;
        grid.appendChild(buildCard(pokemon, isGuaranteed, unlocked));
    }
}

// ─── Init ──────────────────────────────────────────────────────────────────

document.getElementById("btn-back").addEventListener("click", () => {
    window.location.href = "popup.html";
});

render();