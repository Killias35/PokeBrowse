import os
import requests

BASE_DIR = "cries"
os.makedirs(BASE_DIR, exist_ok=True)

def get_pokemon(pokemon_id):
    url = f"https://pokeapi.co/api/v2/pokemon/{pokemon_id}"
    r = requests.get(url)
    r.raise_for_status()
    return r.json()

def download_file(url, path):
    r = requests.get(url, stream=True)
    r.raise_for_status()

    with open(path, "wb") as f:
        for chunk in r.iter_content(chunk_size=8192):
            f.write(chunk)

def main():
    for i in range(1, 152):
        try:
            data = get_pokemon(i)

            cry = (
                data.get("cries", {}).get("latest")
                or data.get("cries", {}).get("legacy")
            )

            if not cry:
                print(f"⚠️ Pas de cry pour {i}")
                continue

            file_path = os.path.join(BASE_DIR, f"{i}.ogg")

            print(f"⬇️ Download {i}: {cry}")

            download_file(cry, file_path)

            print(f"✅ Sauvé: {file_path}")

        except Exception as e:
            print(f"❌ Erreur {i}: {e}")

    print("🎉 Terminé")

if __name__ == "__main__":
    main()