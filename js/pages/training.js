import { setTraining } from "../settingsUtils.js";


(function () {
    'use strict';

    // Table des mécaniques associées à chaque type (reprend les clés de MECHANICS)
    const TYPE_TO_MECHANIC_KEY = {
        normal : 'normal',
        feu : 'fire',
        eau : 'water',
        electrik : 'electric',
        plante : 'grass',
        glace : 'ice',
        combat : 'fighting',
        poison : 'poison',
        sol : 'ground',
        vol : 'flying',
        psy : 'psychic',
        insecte : 'bug',
        roche : 'rock',
        spectre : 'ghost',
        dragon : 'dragon',
        tenebre : 'dark',
        acier : 'steel',
        fée : 'fairy'
    };

    const TYPES = Object.keys(TYPE_TO_MECHANIC_KEY);

    const state = {
        rarity: null,
        pokemon_id: 1,
        types: [],
        shiny: false
    };

    const raritySelector = document.getElementById('raritySelector');
    const typeSelector = document.getElementById('typeSelector');
    const idInput = document.getElementById('pokemon_id_input');
    const shinyToggle = document.getElementById('shinyToggle');
    const spritePreviewWrapper = document.getElementById('spritePreviewWrapper');
    const spritePreview = document.getElementById('spritePreview');
    const selectedCountEl = document.getElementById('selectedCount');
    const startBattleBtn = document.getElementById('startBattleBtn');
    const errorMsg = document.getElementById('errorMsg');

    // --- Génère les boutons de type dynamiquement ---
    TYPES.forEach(type => {
        const btn = document.createElement('button');
        btn.className = `type-option type-${type}`;
        btn.dataset.type = type;
        btn.textContent = type;
        btn.addEventListener('click', () => toggleType(TYPE_TO_MECHANIC_KEY[type], btn));
        typeSelector.appendChild(btn);
    });

    // --- Rareté : sélection unique ---
    raritySelector.addEventListener('click', (e) => {
        const btn = e.target.closest('.rarity-option');
        if (!btn) return;

        raritySelector.querySelectorAll('.rarity-option').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        state.rarity = btn.dataset.rarity;
        clearError();
    });
    
    shinyToggle.addEventListener('click', () => {
        state.shiny = !state.shiny;
        shinyToggle.classList.toggle('active', state.shiny);
        spritePreviewWrapper.classList.toggle('is-shiny', state.shiny);
        updateSprite(idInput.value);
    });

    // --- Types : sélection multiple limitée à 2 ---
    function toggleType(type, btn) {
        const isSelected = state.types.includes(type);

        if (isSelected) {
            state.types = state.types.filter(t => t !== type);
            btn.classList.remove('selected');
        } else {
            if (state.types.length >= 2) {
                showError('Tu ne peux sélectionner que 2 types maximum.');
                return;
            }
            state.types.push(type);
            btn.classList.add('selected');
        }

        selectedCountEl.textContent = state.types.length;
        clearError();
    }

    // --- ID Pokémon + preview sprite ---
    function updateSprite(id) {
        const safeId = Math.max(1, Math.min(1025, parseInt(id, 10) || 1));
        const base = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
        const path = state.shiny ? `${base}/shiny/${safeId}.png` : `${base}/${safeId}.png`;

        spritePreview.style.opacity = 1;
        spritePreview.src = path;
    }

    idInput.addEventListener('input', () => {
        state.pokemon_id = parseInt(idInput.value, 10) || null;
        if (state.pokemon_id) updateSprite(state.pokemon_id);
        clearError();
    });

    updateSprite(idInput.value);

    // --- Erreurs ---
    function showError(message) {
        errorMsg.textContent = message;
    }
    function clearError() {
        errorMsg.textContent = '';
    }

    // --- Lancement du combat ---
    startBattleBtn.addEventListener('click', async () => {
        if (!state.rarity) {
            showError('Sélectionne une rareté.');
            return;
        }
        if (!state.pokemon_id || state.pokemon_id < 1) {
            showError('Sélectionne un identifiant de Pokémon valide.');
            return;
        }
        if (state.types.length === 0) {
            showError('Sélectionne au moins un type.');
            return;
        }

        const config = getBattleConfig();
        console.log('[Training] Configuration du combat :', config);
        await setTraining(config);

        window.open(chrome.runtime.getURL("html/battle.html"));
    });

    function getBattleConfig() {
        return {
            battle : { 
                pokemon_id: state.pokemon_id,
                rarity: state.rarity,
                is_shiny: state.shiny,
                domain_name: 'training'
            },
            types: [...state.types],
            mechanics: state.types.map(t => TYPE_TO_MECHANIC_KEY[t])
        };
    }
})();