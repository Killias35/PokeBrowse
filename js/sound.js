export function playCry(pokemon) {
  const url = chrome.runtime.getURL(`assets/cries/${pokemon.id}.ogg`);
  console.log(url);
  const audio = new Audio(url);

  audio.onerror = () => {
    console.warn("Cry introuvable:", pokemon.id);
  };

  audio.play().catch(() => {});
}


export function startHuntMusic() {

  // évite de relancer une musique déjà en cours
  if (huntMusic) return;

  const randomMusic = Math.floor(Math.random() * 4);

  huntMusic = new Audio(
    chrome.runtime.getURL(`assets/routes/${randomMusic}.mp3`)
  );

  huntMusic.loop = true;
  huntMusic.volume = 0.15;

  huntMusic.play().catch(err => {
    console.error("Impossible de lancer la musique :", err);
    huntMusic = null;
  });
}

export function stopHuntMusic() {
  if (!huntMusic) return;

  huntMusic.pause();
  huntMusic.currentTime = 0;
  huntMusic = null;
}