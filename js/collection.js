async function load() {

  const result =
    await chrome.storage.local.get(
      "collection"
    );

  const collection =
    result.collection || [];

  const list =
    document.getElementById("list");

  collection.forEach((pokemon) => {

    const div =
      document.createElement("div");

    div.innerHTML = `
      <img src="${pokemon.sprites}">
      <span>${pokemon.name}</span>
    `;

    list.appendChild(div);
  });
}

load();