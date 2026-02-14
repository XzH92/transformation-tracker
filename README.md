# Transformation Tracker v0.1

Application web de suivi de transformation physique : poids, mensurations, entrainements, nutrition et analyse IA.

## Fonctionnalites

### Home
- **Saisie rapide du poids** avec date, mise a jour automatique du graphique
- **Saisie de seance** (copier-coller depuis Hevy) enregistree dans le journal
- **Mensurations** : 12 mesures bilaterales (cou, epaules, poitrine, nombril, taille, hanches, biceps G/D, cuisses G/D, mollets G/D)
- **Graphiques interactifs** : evolution du poids et des mensurations avec filtre par periode (1 mois, 3 mois, 6 mois, 1 an)

### Entrainement
- **Routines A/B/C** : creation et edition de 3 routines d'entrainement avec exercices, series, reps et charges
- **Saisie rapide** d'exercices individuels avec RPE
- **Historique des seances** groupe par date

### Nutrition
- **Calculateur TDEE** (formule Mifflin-St Jeor) avec poids auto-recupere depuis la derniere mesure
- **Niveaux d'activite** : sedentaire, leger, modere, actif, tres actif
- **Affichage** : BMR, maintenance, deficit -300 et -500 kcal avec repartition macros (P/G/L)
- **Gestion des supplements** : nom, dose, frequence, dates de debut/fin

### Analyse IA
- **Analyse personnalisee via Mistral AI** de toutes les donnees (poids, mensurations, entrainements, journal)
- 3 types d'analyse : evolution du poids, routine d'entrainement, bilan general
- Conseils et recommandations generes par IA

### Autres
- **Navigation par onglets** (Home / Entrainement / Nutrition)
- **Page Statistiques** dediee avec tableaux de donnees
- **Export CSV** des donnees de poids et mensurations
- **Interface responsive** : desktop, tablette et mobile

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Backend | Python, FastAPI, SQLAlchemy, SQLite |
| Frontend | React, Vite, Chart.js, Axios |
| IA | API Mistral AI |
| Migrations | Alembic |

## Installation

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

Le serveur demarre sur `http://127.0.0.1:8000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

L'application demarre sur `http://localhost:5173`

### Configuration Mistral AI

Copier le fichier d'exemple et ajouter votre cle API :

```bash
cp backend/.env.example backend/.env
# Editer backend/.env avec votre MISTRAL_API_KEY
```

## API Endpoints

| Methode | Route | Description |
|---------|-------|-------------|
| GET/POST | `/poids/` | Lister / ajouter une mesure de poids |
| PUT/DELETE | `/poids/{id}` | Modifier / supprimer une mesure |
| GET/POST | `/mensurations/` | Lister / ajouter des mensurations |
| PUT/DELETE | `/mensurations/{id}` | Modifier / supprimer |
| GET/POST | `/entrainements/` | Lister / ajouter un entrainement |
| PUT/DELETE | `/entrainements/{id}` | Modifier / supprimer |
| GET/POST | `/routines/` | Lister / creer une routine (upsert par nom) |
| PUT/DELETE | `/routines/{id}` | Modifier / supprimer |
| GET/POST | `/supplements/` | Lister / ajouter un supplement |
| PUT/DELETE | `/supplements/{id}` | Modifier / supprimer |
| GET/POST | `/journal/` | Lister / ajouter une entree de journal |
| PUT/DELETE | `/journal/{id}` | Modifier / supprimer |
| POST | `/analyse/` | Analyse IA via Mistral |
| GET | `/export-csv/` | Export CSV des donnees |

## Changelog

### v0.1 — Fevrier 2026
- Structure initiale du projet (FastAPI + React + Vite)
- Modeles de donnees : Poids, Mensuration, Entrainement, Supplement, JournalPhysiologique, Routine
- CRUD complet sur toutes les entites
- Interface a onglets (Home, Entrainement, Nutrition)
- HomePage avec 3 colonnes de saisie rapide + graphiques Chart.js
- EntrainementPage avec routines A/B/C editables + historique
- NutritionPage avec calculateur TDEE + gestion supplements
- Analyse IA Mistral (3 types d'analyse)
- Design responsive (mobile, tablette, desktop)
- Export CSV
