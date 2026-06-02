# 🧢 PokéBrowse (Chrome Extension)

Une extension Chrome qui transforme la navigation web en expérience de capture et de collection de créatures inspirées de l’univers des jeux de type collection.

---

## 🎯 Concept

PokéBrowse ajoute des créatures directement sur les pages web visitées.

Le joueur peut les capturer, les collectionner et compléter son Pokédex au fil de sa navigation.

---

## ⚙️ Fonctionnalités actuelles

### 🧩 Génération de créature
- Génération aléatoire d’un Pokémon
- Déclenchement manuel via le popup de l’extension
- Affichage d’un sprite directement sur la page active avec son cri associé

---

### 👆 Capture simple
- Capture via un clic sur le Pokémon
- Suppression immédiate après capture
- Ajout automatique à la collection locale

---

### 📦 Collection locale
- Stockage via `chrome.storage.local`
- Liste des Pokémon capturés
- Affichage du nom et du sprite
- Comptage des captures

---

### 📖 Pokédex
- Liste des Pokémon (1ère génération)
- Données issues de l’API PokéAPI
- Page dédiée Pokédex

---

## 🧠 Architecture actuelle

- Popup (interface utilisateur)
- Content script (interaction avec les pages web)
- Background service worker (logique globale)
- PokéAPI (données Pokémon)
- Chrome Storage (persistance locale)

---

## 🚧 Fonctionnalités futures

### 🌍 Apparition contextuelle
- Créatures liées au type de site visité
- Système de “biomes web” (news, réseaux sociaux, gaming, etc.)

---

### 🐾 Comportement des créatures
- Déplacement sur la page
- Temps limité avant disparition
- Comportements différents selon l’espèce

---

### ⭐ Rareté et progression
- Système de rareté (commun, rare, épique, légendaire)
- Apparition de versions shiny
- Statistiques de progression du joueur

---

### 🏆 Leaderboard (backend)
- Classement des joueurs
- Nombre total de captures
- Créatures rares capturées
- API dédiée (Node.js / Firebase)

---

### 📊 Pokédex avancé
- Descriptions en français
- Types et statistiques complètes
- Historique des captures
- Recherche et filtres

---

### 🎮 Gamification
- Succès et badges
- Streak de navigation
- Évolution basée sur l’activité web

---

## 🧱 Améliorations techniques possibles

- Migration vers un bundler (Vite / Webpack)
- Architecture modulaire (engine / ui / utils)
- Synchronisation cloud des collections
- Mode hors ligne amélioré

---

## ⚡ Vision

Transformer la navigation web quotidienne en une expérience de collection vivante, sans modifier les usages du web, mais en les enrichissant de manière légère et interactive.

---

## 📌 Statut

Projet en cours de développement (MVP fonctionnel)