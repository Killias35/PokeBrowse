// tourne avec utils.js

let activeHunt = false;

chrome.runtime.onMessage.addListener(
  async (message) => {
    if (message.action == "spawnPokemon")
      await spawnPokemon();
  }
);

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "activeHunt") {
    activeHunt = msg.value;
    const audio = new Audio();
    audio.volume = 0;
    audio.play().catch(() => {});
  }
});

function playCry(pokemon) {
  const url = chrome.runtime.getURL(`assets/cries/${pokemon.id}.ogg`);
  console.log(url);
  const audio = new Audio(url);

  audio.onerror = () => {
    console.warn("Cry introuvable:", pokemon.id);
  };

  audio.play().catch(() => {});
}

async function spawnPokemon() {
  const randomId = Math.floor(Math.random() * 151) + 1;
  const pokemon = await getPokemon(randomId);

  const img = document.createElement("img");

  const pageWidth = Math.max(
    document.body.scrollWidth,
    document.documentElement.scrollWidth
  );

  const pageHeight = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight
  );

  const x = Math.floor(Math.random() * (pageWidth - 100));
  const y = Math.floor(Math.random() * (pageHeight - 100));

  img.src = pokemon.sprites;

  img.style.position = "absolute";
  img.style.left = `${x}px`;
  img.style.top = `${y}px`;

  img.style.width = "96px";
  img.style.zIndex = "999999";
  img.style.cursor = "pointer";

  img.style.transition = "transform 0.2s ease";

  img.addEventListener("mouseenter", () => {
    img.style.transform = "scale(1.2)";
  });

  img.addEventListener("mouseleave", () => {
    img.style.transform = "scale(1)";
  });

  img.addEventListener("click", () => {
    capturePokemon(pokemon);
    img.remove();
  });

  document.body.appendChild(img);

  playCry(pokemon);
}

function loop() {                               // spawn moyen: 6 pkmn / heure
  const delay = Math.random() * 300000 + 60000; // entre 1 minute et 6 minutes

  setTimeout(async () => {
    if (Math.random() < 0.35 && activeHunt) {                 // 35% de chance
      await spawnPokemon();
    }
    loop();
  }, delay);
}

loop();