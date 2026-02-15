# Transformation Tracker v0.2

Application web de suivi de transformation physique : poids, mensurations, entraînements, nutrition et analyse IA.

## Fonctionnalités

### Authentification
- **Inscription / Connexion** avec nom d'utilisateur et mot de passe
- **Tokens JWT** (Bearer) sur tous les endpoints — expiration configurable (24h par défaut)
- **Déconnexion** manuelle ou automatique (token expiré → retour au login)
- Mots de passe hachés en **bcrypt**

### Home
- **Saisie rapide du poids** avec date, mise à jour automatique du graphique
- **Saisie de séance** (copier-coller depuis Hevy) enregistrée dans le journal
- **Mensurations** : 12 mesures bilatérales (cou, épaules, poitrine, nombril, taille, hanches, biceps G/D, cuisses G/D, mollets G/D)
- **Graphiques interactifs** : évolution du poids et des mensurations avec filtre par période (1 mois, 3 mois, 6 mois, 1 an)

### Entraînement
- **Routines A/B/C** : création et édition de 3 routines d'entraînement avec exercices, séries, reps et charges
- **Saisie rapide** d'exercices individuels avec RPE
- **Historique des séances** groupé par date

### Nutrition
- **Calculateur TDEE** (formule Mifflin-St Jeor) avec poids auto-récupéré depuis la dernière mesure
- **Niveaux d'activité** : sédentaire, léger, modéré, actif, très actif
- **Affichage** : BMR, maintenance, déficit -300 et -500 kcal avec répartition macros (P/G/L)
- **Gestion des suppléments** : nom, dose, fréquence, dates de début/fin

### Analyse IA
- **Analyse personnalisée via Mistral AI** de toutes les données (poids, mensurations, entraînements, journal)
- 3 types d'analyse : évolution du poids, routine d'entraînement, bilan général
- Conseils et recommandations générés par IA

### Autres
- **HTTPS** : certificats SSL auto-signés pour le dev (frontend Vite + backend Uvicorn)
- **Navigation par onglets** (Home / Entraînement / Nutrition)
- **Page Statistiques** dédiée avec tableaux de données
- **Export CSV** des données de poids et mensurations
- **Interface responsive** : desktop, tablette et mobile
- **Interface entièrement en français** avec accents corrects

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Backend | Python, FastAPI, SQLAlchemy, SQLite |
| Auth | JWT (python-jose), bcrypt (passlib) |
| Frontend | React 19, Vite, Chart.js, Axios |
| IA | API Mistral AI |
| Sécurité | HTTPS (auto-signé), CORS, en-têtes de sécurité, HSTS (prod) |
| Migrations | Alembic |

## Installation

### 1. Certificats SSL (optionnel, recommandé)

```bash
bash generate-certs.sh
```

Génère `certs/cert.pem` et `certs/key.pem` pour HTTPS local.

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows
pip install -r requirements.txt
cp .env.example .env
# Éditer .env : MISTRAL_API_KEY, JWT_SECRET_KEY
python main.py
```

Le serveur démarre sur `https://127.0.0.1:8000` (ou `http://` sans certificats).

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

L'application démarre sur `https://localhost:5173` (ou `http://` sans certificats).

### 4. Premier lancement

1. Ouvrir l'application dans le navigateur
2. Créer un compte via le formulaire d'inscription
3. Se connecter — l'application charge automatiquement les données

## Configuration (.env)

| Variable | Description | Défaut |
|----------|-------------|--------|
| `MISTRAL_API_KEY` | Clé API Mistral pour l'analyse IA | — (requis pour l'analyse) |
| `JWT_SECRET_KEY` | Clé secrète pour signer les tokens JWT | Aléatoire (non persistant) |
| `JWT_EXPIRE_MINUTES` | Durée de validité des tokens (minutes) | `1440` (24h) |
| `HOST` | Adresse d'écoute du serveur | `0.0.0.0` |
| `PORT` | Port du serveur | `8000` |
| `CORS_ALLOW_ORIGINS` | Origines autorisées (séparées par des virgules) | `https://localhost:5173,http://localhost:5173` |
| `ENVIRONMENT` | `development` ou `production` | `development` |

## API Endpoints

### Authentification (publics)

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/auth/register` | Créer un compte (username + password) |
| POST | `/auth/login` | Se connecter (OAuth2 password flow) |
| GET | `/auth/me` | Infos de l'utilisateur connecté |

### Données (protégés par JWT)

| Méthode | Route | Description |
|---------|-------|-------------|
| GET/POST | `/poids/` | Lister / ajouter une mesure de poids |
| PUT/DELETE | `/poids/{id}` | Modifier / supprimer une mesure |
| GET/POST | `/mensurations/` | Lister / ajouter des mensurations |
| PUT/DELETE | `/mensurations/{id}` | Modifier / supprimer |
| GET/POST | `/entrainements/` | Lister / ajouter un entraînement |
| PUT/DELETE | `/entrainements/{id}` | Modifier / supprimer |
| GET/POST | `/routines/` | Lister / créer une routine (upsert par nom) |
| PUT/DELETE | `/routines/{id}` | Modifier / supprimer |
| GET/POST | `/supplements/` | Lister / ajouter un supplément |
| PUT/DELETE | `/supplements/{id}` | Modifier / supprimer |
| GET/POST | `/journal/` | Lister / ajouter une entrée de journal |
| PUT/DELETE | `/journal/{id}` | Modifier / supprimer |
| POST | `/analyse/` | Analyse IA via Mistral |
| GET | `/export-csv/` | Export CSV des données |

## Changelog

### v0.2 — Février 2026
- **Authentification JWT** : inscription, connexion, protection de tous les endpoints
  - Modèle `User` (username + mot de passe bcrypt)
  - Tokens JWT signés HS256, expiration configurable
  - Page de login/inscription dans le frontend
  - Intercepteur 401 : déconnexion automatique
  - Bouton Déconnexion dans la navigation
- **HTTPS** : certificats SSL auto-signés pour le développement
  - Vite configuré pour servir en HTTPS (détection auto des certificats)
  - Uvicorn lancé avec SSL via `python main.py`
  - Script `generate-certs.sh` pour régénérer les certificats
  - `lang="fr"` dans le HTML
- **Correction des accents français** dans toute l'interface (~40 chaînes)
  - Labels, messages, placeholders, descriptions, prompts IA
  - Titre de page : « Suivi de transformation physique »
- **Module API centralisé** (`api.js`) : tous les composants utilisent une instance axios unique avec token Bearer

### v0.1 — Février 2026
- Structure initiale du projet (FastAPI + React + Vite)
- Modèles de données : Poids, Mensuration, Entraînement, Supplément, JournalPhysiologique, Routine
- CRUD complet sur toutes les entités
- Interface à onglets (Home, Entraînement, Nutrition)
- HomePage avec 3 colonnes de saisie rapide + graphiques Chart.js
- EntrainementPage avec routines A/B/C éditables + historique
- NutritionPage avec calculateur TDEE + gestion suppléments
- Analyse IA Mistral (3 types d'analyse)
- Design responsive (mobile, tablette, desktop)
- Export CSV
