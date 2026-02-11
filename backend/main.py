from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel
from datetime import date
from typing import Optional
from sqlalchemy.orm import Session
from database import SessionLocal, Poids, Mensuration, Base, engine

# Modèles Pydantic
class PoidsCreate(BaseModel):
    valeur: float
    date_mesure: str

class MensurationCreate(BaseModel):
    taille: Optional[float] = None
    bras: Optional[float] = None
    cuisses: Optional[float] = None
    date_mesure: str

# Initialisation de l'application FastAPI
app = FastAPI()

# Configuration CORS
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Fonction pour obtenir une session de base de données
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Endpoints pour les poids
@app.post("/poids/")
def ajouter_poids(poids_data: PoidsCreate, db: Session = Depends(get_db)):
    try:
        mesure_existante = db.query(Poids).filter(Poids.date == date.fromisoformat(poids_data.date_mesure)).first()
        if mesure_existante:
            mesure_existante.valeur = poids_data.valeur
            db.commit()
            return {"message": "Mesure de poids mise à jour avec succès !", "id": mesure_existante.id}
        else:
            nouvelle_mesure = Poids(valeur=poids_data.valeur, date=date.fromisoformat(poids_data.date_mesure))
            db.add(nouvelle_mesure)
            db.commit()
            db.refresh(nouvelle_mesure)
            return {"message": "Mesure de poids ajoutée avec succès !", "id": nouvelle_mesure.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/poids/")
def lire_poids(db: Session = Depends(get_db)):
    poids = db.query(Poids).all()
    return {"poids": poids}

# Endpoints pour les mensurations
@app.post("/mensurations/")
def ajouter_mensuration(mensuration_data: MensurationCreate, db: Session = Depends(get_db)):
    try:
        mensuration_existante = db.query(Mensuration).filter(Mensuration.date == date.fromisoformat(mensuration_data.date_mesure)).first()
        if mensuration_existante:
            if mensuration_data.taille is not None:
                mensuration_existante.taille = mensuration_data.taille
            if mensuration_data.bras is not None:
                mensuration_existante.bras = mensuration_data.bras
            if mensuration_data.cuisses is not None:
                mensuration_existante.cuisses = mensuration_data.cuisses
            db.commit()
            return {"message": "Mensurations mises à jour avec succès !", "id": mensuration_existante.id}
        else:
            nouvelle_mensuration = Mensuration(
                taille=mensuration_data.taille,
                bras=mensuration_data.bras,
                cuisses=mensuration_data.cuisses,
                date=date.fromisoformat(mensuration_data.date_mesure)
            )
            db.add(nouvelle_mensuration)
            db.commit()
            db.refresh(nouvelle_mensuration)
            return {"message": "Mensurations ajoutées avec succès !", "id": nouvelle_mensuration.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/mensurations/")
def lire_mensurations(db: Session = Depends(get_db)):
    mensurations = db.query(Mensuration).all()
    return {"mensurations": mensurations}

@app.get("/")
def read_root():
    return {"message": "Bienvenue sur l'API de suivi de transformation physique !"}
