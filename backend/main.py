from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date
from database import SessionLocal, Poids, Base, engine

app = FastAPI()

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Autorise uniquement ton frontend
    allow_credentials=True,
    allow_methods=["*"],  # Autorise toutes les méthodes (GET, POST, etc.)
    allow_headers=["*"],  # Autorise tous les headers
)


# Fonction pour obtenir une session de base de données
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Endpoint pour ajouter une mesure de poids
from pydantic import BaseModel

class PoidsCreate(BaseModel):
    valeur: float
    date_mesure: str

@app.post("/poids/")
def ajouter_poids(poids_data: PoidsCreate, db: Session = Depends(get_db)):
    try:
        # Vérifie si une mesure existe déjà pour cette date
        mesure_existante = db.query(Poids).filter(Poids.date == date.fromisoformat(poids_data.date_mesure)).first()

        if mesure_existante:
            # Met à jour la mesure existante
            mesure_existante.valeur = poids_data.valeur
            db.commit()
            return {"message": "Mesure de poids mise à jour avec succès !", "id": mesure_existante.id}
        else:
            # Crée une nouvelle mesure
            nouvelle_mesure = Poids(valeur=poids_data.valeur, date=date.fromisoformat(poids_data.date_mesure))
            db.add(nouvelle_mesure)
            db.commit()
            db.refresh(nouvelle_mesure)
            return {"message": "Mesure de poids ajoutée avec succès !", "id": nouvelle_mesure.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


# Endpoint pour récupérer toutes les mesures de poids
@app.get("/poids/")
def lire_poids(db: Session = Depends(get_db)):
    poids = db.query(Poids).all()
    return {"poids": poids}

@app.get("/")
def read_root():
    return {"message": "Bienvenue sur l'API de suivi de transformation physique !"}
