
// ─── BASE DE DONNÉES DES ATTAQUES PAR TYPE ───────────────────
//
//  Chaque entrée décrit :
//   • attackName  : nom affiché façon Pokémon
//   • color       : couleur dominante
//   • accent      : couleur secondaire / highlight
//   • duration    : durée en ms
//   • mechanic    : identifiant de la mécanique de jeu
//   • theme       : classe CSS appliquée à l'arène
//   • description : sous-titre affiché au lancement
//
export const ATTACK_CONFIGS = {

  // 🔥 FEU — anneaux de feu qui se propagent vers l'extérieur
  fire: {
    attackName: "Déflagration",
    color: "#ff4500",
    accent: "#ffaa00",
    duration: 5000,
    mechanic: "fire_rings",
    theme: "theme-fire",
    description: "Esquive les anneaux de flammes !"
  },

  // 💧 EAU — jets horizontaux qui balaient l'arène
  water: {
    attackName: "Hydrocanon",
    color: "#38bdf8",
    accent: "#bfdbfe",
    duration: 6000,
    mechanic: "water_sweep",
    theme: "theme-water",
    description: "Évite les jets d'eau dévastateurs !"
  },

  // ⚡ ÉLECTRIK — éclairs qui frappent des zones aléatoires
  electric: {
    attackName: "Fatal-Foudre",
    color: "#facc15",
    accent: "#fff176",
    duration: 5000,
    mechanic: "electric_bolts",
    theme: "theme-electric",
    description: "Ne reste pas dans les zones surlignées !"
  },

  // 🌿 PLANTE — lianes qui traversent l'arène
  grass: {
    attackName: "Tranch'Herbe",
    color: "#4ade80",
    accent: "#bbf7d0",
    duration: 6000,
    mechanic: "grass_vines",
    theme: "theme-grass",
    description: "Évite les lianes tranchantes !"
  },

  // ❄️ GLACE — projectiles qui ralentissent + gel progressif
  ice: {
    attackName: "Blizzard",
    color: "#a5f3fc",
    accent: "#e0f2fe",
    duration: 7000,
    mechanic: "ice_freeze",
    theme: "theme-ice",
    description: "Évite de te faire geler !"
  },

  // 🌍 SOL — ondes de choc qui irradient depuis le sol
  ground: {
    attackName: "Séisme",
    color: "#a16207",
    accent: "#fde68a",
    duration: 6000,
    mechanic: "ground_shockwaves",
    theme: "theme-ground",
    description: "Esquive les ondes de choc !"
  },

  // 🪨 ROCHE — météorites massives
  rock: {
    attackName: "Éboulement",
    color: "#3d3a37",
    accent: "#e7e5e4",
    duration: 6000,
    mechanic: "rock_boulders",
    theme: "theme-rock",
    description: "Évite les rochers qui tombent !"
  },

  // 💨 VOL — rafales qui dévient ta trajectoire
  flying: {
    attackName: "Aéropique",
    color: "#bae6fd",
    accent: "#ffffff",
    duration: 6000,
    mechanic: "flying_gusts",
    theme: "theme-flying",
    description: "Résiste aux courants aériens !"
  },

  // 🧠 PSY — contrôles inversés + zones d'illusion
  psychic: {
    attackName: "Psyko",
    color: "#f472b6",
    accent: "#fce7f3",
    duration: 5000,
    mechanic: "psychic_distort",
    theme: "theme-psychic",
    description: "Ton esprit est retourné... !"
  },

  // 🐛 INSECTE — essaim en formation qui progresse
  bug: {
    attackName: "Dard-Nuée",
    color: "#a3e635",
    accent: "#ecfccb",
    duration: 6000,
    mechanic: "bug_swarm",
    theme: "theme-bug",
    description: "Échappe au nuage d'insectes !"
  },

  // 👻 SPECTRE — obscurité totale + zones mortelles invisibles
  ghost: {
    attackName: "Ténèbres",
    color: "#7c3aed",
    accent: "#c4b5fd",
    duration: 6000,
    mechanic: "ghost_dark",
    theme: "theme-ghost",
    description: "Survie dans l'obscurité totale !"
  },

  // 🐉 DRAGON — spirale de météores
  dragon: {
    attackName: "Draco-Météor",
    color: "#6366f1",
    accent: "#c7d2fe",
    duration: 6000,
    mechanic: "dragon_spiral",
    theme: "theme-dragon",
    description: "Échappe à la spirale cosmique !"
  },

  // 🌑 TÉNÈBRES — zones aléatoires qui explosent avec délai
  dark: {
    attackName: "Jackpot Sombre",
    color: "#1e1b4b",
    accent: "#818cf8",
    duration: 6000,
    mechanic: "dark_mines",
    theme: "theme-dark",
    description: "Ne reste pas sur les zones maudites !"
  },

  // ⚙️ ACIER — plaques qui se ferment depuis les bords
  steel: {
    attackName: "Poing-Éclair",
    color: "#94a3b8",
    accent: "#e2e8f0",
    duration: 6000,
    mechanic: "steel_walls",
    theme: "theme-steel",
    description: "Échappe aux murs d'acier !"
  },

  // 🧪 POISON — nuage toxique qui envahit l'arène
  poison: {
    attackName: "Toxic",
    color: "#a855f7",
    accent: "#e9d5ff",
    duration: 6000,
    mechanic: "poison_cloud",
    theme: "theme-poison",
    description: "Évite les zones empoisonnées !"
  },

  // 🥊 COMBAT — poing géant qui smash des zones
  fighting: {
    attackName: "Close Combat",
    color: "#f97316",
    accent: "#fed7aa",
    duration: 5000,
    mechanic: "fighting_punches",
    theme: "theme-fighting",
    description: "Esquive les coups !"
  },

  // 🌟 FÉE — cercles enchantés qui explosent
  fairy: {
    attackName: "Blizzard Féerique",
    color: "#ec4899",
    accent: "#fbcfe8",
    duration: 6000,
    mechanic: "fairy_circles",
    theme: "theme-fairy",
    description: "Évite les cercles enchantés !"
  },

  // 🌋 NORMAL — projectiles classiques (fallback)
  normal: {
    attackName: "Giga Impact",
    color: "#a8a29e",
    accent: "#e7e5e4",
    duration: 5000,
    mechanic: "normal_drops",
    theme: "theme-normal",
    description: "Esquive les projectiles !"
  }
};