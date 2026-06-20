/**
 * Injecte une seule fois le CSS nécessaire aux pokemons sauvages
 * (silhouette noire + contour blanc, animations d'apparition/disparition,
 * flottement, halo doré pour les shiny, et flash de révélation à la capture).
 */
export function injectPokemonStyles() {
  const STYLE_ID = "wild-pokemon-styles";
  if (document.getElementById(STYLE_ID)) return;

  // Contour blanc + silhouette noire, réutilisé partout (sprite normal,
  // shiny au repos, début du flash de capture) pour rester identique.
  // Un seul drop-shadow flou au lieu de 8 superposés : bien plus léger
  // à recalculer à chaque frame (le contour est un peu plus doux, mais
  // tout aussi lisible).
  const SILHOUETTE = "brightness(0) drop-shadow(0 0 2px #ffffff)";

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes wp-spawn-in {
      0%   { transform: scale(0) translateY(40px); opacity: 0; }
      60%  { transform: scale(1.15) translateY(-6px); opacity: 1; }
      80%  { transform: scale(0.92) translateY(2px); }
      100% { transform: scale(1) translateY(0); opacity: 1; }
    }

    @keyframes wp-float {
      0%, 100% { transform: translateY(0); }
      50%      { transform: translateY(-8px); }
    }

    @keyframes wp-flee-out {
      0%   { transform: scale(1) translateX(0) translateY(0); opacity: 1; }
      100% { transform: scale(0.35) translateX(50px) translateY(-40px); opacity: 0; }
    }

    @keyframes wp-capture-out {
      0%   { transform: scale(1); opacity: 1; }
      30%  { transform: scale(1.35); opacity: 1; }
      100% { transform: scale(0); opacity: 0; }
    }

    /* Le sprite shiny reste une silhouette (caché), seule une lueur dorée
       pulse autour pour trahir sa présence sans révéler ses couleurs. */
    @keyframes wp-shiny-glow {
      0%, 100% { filter: ${SILHOUETTE} drop-shadow(0 0 6px #ffd23f); }
      50%      { filter: ${SILHOUETTE} drop-shadow(0 0 12px #ffd23f); }
    }

    /* Flash de révélation au moment de la capture : la silhouette
       laisse place aux vraies couleurs du pokemon (shiny ou pas). */
    @keyframes wp-reveal-flash {
      0%   { filter: ${SILHOUETTE}; }
      40%  { filter: brightness(1.4) drop-shadow(0 0 8px #fff7c2); }
      100% { filter: none; }
    }

    .wild-pokemon-wrapper {
      position: absolute;
      z-index: 999999;
      pointer-events: none; /* le clic se fait sur le sprite, pas sur le conteneur */
      will-change: transform;
      animation:
        wp-spawn-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both,
        wp-float 2.4s ease-in-out infinite 0.45s;
    }

    /* petite ombre au sol, purement décorative */
    .wild-pokemon-wrapper::after {
      content: "";
      position: absolute;
      bottom: -6px;
      left: 50%;
      width: 60px;
      height: 14px;
      margin-left: -30px;
      background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.35) 0%, rgba(0, 0, 0, 0) 80%);
      border-radius: 50%;
      z-index: -1;
    }

    .wild-pokemon-wrapper.is-fled {
      animation: wp-flee-out 0.4s ease-in forwards;
    }

    .wild-pokemon-wrapper.is-captured {
      animation: wp-capture-out 0.35s ease-in forwards;
    }

    .wild-pokemon-sprite {
      display: block;
      width: 96px;
      cursor: pointer;
      pointer-events: auto;
      /* silhouette noire + contour blanc façon "Qui est ce Pokémon ?" */
      filter: ${SILHOUETTE};
      transition: transform 0.15s ease;
    }

    .wild-pokemon-sprite:hover {
      transform: scale(1.18) rotate(-3deg);
    }

    /* shiny au repos : reste caché, juste la lueur dorée pulse */
    .wild-pokemon-sprite.is-shiny {
      animation: wp-shiny-glow 1.2s ease-in-out infinite;
      will-change: filter;
    }

    /* au clic / capture : révèle les vraies couleurs du sprite.
       Placée après .is-shiny pour gagner en cas de cumul des deux classes. */
    .wild-pokemon-sprite.is-captured {
      animation: wp-reveal-flash 0.5s ease-out forwards;
    }
  `;
  document.head.appendChild(style);
}