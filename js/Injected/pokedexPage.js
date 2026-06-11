import { getPokedex, loadCollection } from "./pokedex.js";


// --- MISE À JOUR DU BADGE ---
function updateBadge(percent) {
    const badge = document.getElementById("nb-pokemons-badge");
    badge.textContent = percent.toFixed(1) + "%";

    // On retire les anciennes classes
    badge.className = "completion-badge";
    const level = Math.min(100, Math.floor(percent / 10) * 10);
    badge.classList.add(`badge-${level}`);
}

// --- INITIALISATION PRINCIPALE ---
async function init() {
    const container = document.getElementById("pokedex");
    const pokedexData = await getPokedex();
    const collectionData = await loadCollection();

    // Calcul de complétion
    const capturedCount = Object.keys(collectionData).length;
    const completion = (capturedCount / pokedexData.length) * 100;
    updateBadge(completion);

    pokedexData.forEach((pokemon) => {
        const caughtInfo = collectionData[pokemon.id] || null;
        const isCaught = !!caughtInfo;
        const captureCount = isCaught ? caughtInfo.count : 0;
        const hasShiny = isCaught ? caughtInfo.hasShiny : false;
        const rarity = pokemon.rarity || 'commun';

        const card = document.createElement("div");
        
        // Si non capturé, on applique la classe .locked (qui masque la rareté)
        card.className = `pokemon-card ${isCaught ? `rarity-${rarity}` : 'locked'}`;

        const normalSprite = pokemon.sprites;
        const shinySprite = pokemon.shinySprite || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${pokemon.id}.png`;
        
        // Le sprite de base affiché dépend s'il a le shiny ou non
        const defaultSpriteDisplay = normalSprite;

        card.innerHTML = `
            <div class="card-header">
                <!-- On englobe la rareté et le bouton shiny à gauche -->
                <div class="header-left">
                    ${isCaught ? `<span class="rarity-badge">${rarity}</span>` : `<span class="rarity-badge locked-badge">???</span>`}
                    ${(hasShiny && isCaught) ? `<button class="shiny-toggle" title="Voir la forme normale/shiny">✨</button>` : ''}
                </div>
                
                <!-- Le badge de capture reste indépendant pour se placer en haut à droite -->
                ${isCaught ? `<div class="capture-count">x${captureCount}</div>` : ''}
            </div>
            
            <div class="sprite-container">
                <div class="glow-backdrop"></div>
                <img src="${defaultSpriteDisplay}" alt="${pokemon.name}" class="pkmn-img">
            </div>
            
            <h3><span class="id-tag">#${pokemon.id.toString().padStart(3, "0")}</span> ${isCaught ? pokemon.name : '???'}</h3>
            
            <button class="details-btn" data-id="${pokemon.id}">
                ${isCaught ? 'Voir les détails' : 'Données inconnues'}
            </button>
        `;

        // Logique du bouton Shiny (uniquement si débloqué)
        if (hasShiny && isCaught) {
            let showingShiny = false; // Par défaut, on montre le shiny s'il l'a !
            const imgEl = card.querySelector(".pkmn-img");
            const shinyBtn = card.querySelector(".shiny-toggle");

            shinyBtn.addEventListener("click", () => {
                showingShiny = !showingShiny;
                if (showingShiny) playShiny(); 
                imgEl.style.transform = "scale(0)";
                setTimeout(() => {
                    imgEl.src = showingShiny ? shinySprite : normalSprite;
                    imgEl.style.transform = "scale(1)";
                }, 150);
                shinyBtn.classList.toggle("active", showingShiny);
            });
        }

        // Logique Modale
        card.querySelector(".details-btn").addEventListener("click", () => {
            openPokemonModal(pokemon, isCaught, hasShiny);
        });

        container.appendChild(card);
    });
}

// --- GESTION DE LA MODALE ---
const modal = document.getElementById("pokemon-modal");
const modalBody = document.getElementById("modal-body");
const closeModalBtn = document.getElementById("close-modal");

closeModalBtn.addEventListener("click", () => modal.classList.add("hidden"));
modal.addEventListener("click", (e) => { if(e.target === modal) modal.classList.add("hidden"); });

function openPokemonModal(pokemon, isCaught, hasShiny) {
    if (!isCaught) {
        // --- MODALE POKÉMON NON DÉCOUVERT ---
        modalBody.innerHTML = `
            <div class="modal-grid locked-modal">
                <div class="modal-left">
                    <div class="modal-img-container">
                        <img src="${pokemon.sprites}" alt="?" class="modal-img locked-img">
                    </div>
                </div>
                <div class="modal-right">
                    <div class="modal-title">
                        <span class="id-tag">#${pokemon.id.toString().padStart(3, "0")}</span>
                        <h2>Espèce Inconnue</h2>
                    </div>
                    <p style="color: #64748b; margin-top: 20px;">Capturez ce Pokémon pour dévoiler ses données, ses statistiques et son type.</p>
                </div>
            </div>
        `;
    } else {
        // --- MODALE POKÉMON DÉCOUVERT (Ancien code) ---
        const statNames = { 'hp': 'PV', 'attack': 'Attaque', 'defense': 'Défense', 'special-attack': 'Atk Spé', 'special-defense': 'Déf Spé', 'speed': 'Vitesse' };
        const typesHtml = pokemon.types.map(type => `<span class="type-badge type-${type}">${type}</span>`).join('');
        
        let statsHtml = '';
        for (const [key, value] of Object.entries(pokemon.stats)) {
            const percentage = Math.min((value / 200) * 100, 100);
            statsHtml += `
                <div class="stat-row stat-${key}">
                    <div class="stat-name">${statNames[key] || key}</div>
                    <div class="stat-value">${value}</div>
                    <div class="stat-bar-bg"><div class="stat-bar-fill" style="--target-width: ${percentage}%"></div></div>
                </div>
            `;
        }

        const displaySprite = hasShiny ? (pokemon.shinySprite || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${pokemon.id}.png`) : pokemon.sprites;

        modalBody.innerHTML = `
            <div class="modal-grid">
                <div class="modal-left">
                    <div class="modal-img-container">
                        <img src="${displaySprite}" alt="${pokemon.name}" class="modal-img">
                    </div>
                    ${pokemon.cry ? `<button class="modal-cry-btn" id="play-cry">🔊 Écouter le cri</button>` : ''}
                    <div class="modal-physique" style="margin-top: 15px; justify-content: center;">
                        <span>📏 ${pokemon.height / 10} m</span>
                        <span>⚖️ ${pokemon.weight / 10} kg</span>
                    </div>
                </div>
                <div class="modal-right">
                    <div class="modal-title">
                        <span class="id-tag">#${pokemon.id.toString().padStart(3, "0")}</span>
                        <h2>${pokemon.name}</h2>
                        <span class="rarity-badge rarity-${pokemon.rarity}">${pokemon.rarity}</span>
                    </div>
                    <div class="modal-types">${typesHtml}</div>
                    <div class="modal-stats" style="margin-top: 25px;">${statsHtml}</div>
                </div>
            </div>
        `;

        if (pokemon.cry) {
            document.getElementById("play-cry").addEventListener("click", () => {
                const audio = new Audio(pokemon.cry); audio.volume = 0.5; audio.play();
            });
        }
    }

    modal.classList.remove("hidden");
    if (isCaught) {
        setTimeout(() => {
            document.querySelectorAll('.stat-bar-fill').forEach(bar => {
                bar.style.width = bar.style.getPropertyValue('--target-width');
            });
        }, 50);
    }
}

// --- RESET COLLECTION ---
document.getElementById("reset-collection").addEventListener("click", async () => {
    const confirmation = confirm("⚠️ Es-tu sûr de vouloir relâcher tous tes Pokémon ? Cette action est définitive !");
    if (confirmation) {
        await chrome.storage.local.set({ collection: [] });
        alert("Tous les Pokémon ont été relâchés dans la nature !");
        location.reload();
    }
});

// Go!
init();