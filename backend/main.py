from fastapi import FastAPI, Depends, HTTPException, Response, Request
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, field_validator
from datetime import date, datetime, timedelta, timezone
from typing import Optional, List
from sqlalchemy.orm import Session
from models import SessionLocal, Poids, Mensuration, Entrainement, Supplement, JournalPhysiologique, Routine, User, Base, engine
from passlib.context import CryptContext
from jose import JWTError, jwt
import csv
import io
import os
import json
import secrets
import logging
from dotenv import load_dotenv
import httpx

load_dotenv()

# Configuration du logging securise
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Authentification JWT ---
SECRET_KEY = os.getenv("JWT_SECRET_KEY", secrets.token_urlsafe(64))
if os.getenv("JWT_SECRET_KEY") is None:
    logger.warning("JWT_SECRET_KEY non défini — une clé aléatoire a été générée (les tokens ne survivront pas à un redémarrage)")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "1440"))  # 24h par défaut

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(lambda: next(get_db()))):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Token invalide ou expiré",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user


class UserCreate(BaseModel):
    username: str
    password: str

    @field_validator('username')
    @classmethod
    def username_valide(cls, v):
        v = v.strip()
        if len(v) < 3 or len(v) > 50:
            raise ValueError("Le nom d'utilisateur doit faire entre 3 et 50 caractères")
        return v

    @field_validator('password')
    @classmethod
    def password_valide(cls, v):
        if len(v) < 8:
            raise ValueError("Le mot de passe doit faire au moins 8 caractères")
        return v

# Modèles Pydantic avec validation
class PoidsCreate(BaseModel):
    valeur: float
    date_mesure: str

    @field_validator('valeur')
    @classmethod
    def valeur_positive(cls, v):
        if v <= 0 or v > 500:
            raise ValueError('Le poids doit être entre 0 et 500 kg')
        return v

    @field_validator('date_mesure')
    @classmethod
    def date_valide(cls, v):
        try:
            date.fromisoformat(v)
        except ValueError:
            raise ValueError('Format de date invalide (attendu: YYYY-MM-DD)')
        return v

class MensurationCreate(BaseModel):
    date_mesure: str
    taille: Optional[float] = None
    cou: Optional[float] = None
    epaules: Optional[float] = None
    poitrine: Optional[float] = None
    nombril: Optional[float] = None
    hanches: Optional[float] = None
    biceps_gauche: Optional[float] = None
    biceps_droit: Optional[float] = None
    cuisse_gauche: Optional[float] = None
    cuisse_droite: Optional[float] = None
    mollet_gauche: Optional[float] = None
    mollet_droit: Optional[float] = None

    @field_validator('date_mesure')
    @classmethod
    def date_valide(cls, v):
        try:
            date.fromisoformat(v)
        except ValueError:
            raise ValueError('Format de date invalide (attendu: YYYY-MM-DD)')
        return v

    @field_validator('taille', 'cou', 'epaules', 'poitrine', 'nombril', 'hanches',
                     'biceps_gauche', 'biceps_droit', 'cuisse_gauche', 'cuisse_droite',
                     'mollet_gauche', 'mollet_droit')
    @classmethod
    def mensuration_positive(cls, v):
        if v is not None and (v <= 0 or v > 300):
            raise ValueError('Les mensurations doivent être entre 0 et 300 cm')
        return v

class EntrainementCreate(BaseModel):
    date: str
    exercice: str
    series: int
    reps: int
    charge: Optional[float] = None
    rpe: Optional[float] = None
    notes: Optional[str] = None

    @field_validator('date')
    @classmethod
    def date_valide(cls, v):
        try:
            date.fromisoformat(v)
        except ValueError:
            raise ValueError('Format de date invalide (attendu: YYYY-MM-DD)')
        return v

    @field_validator('exercice')
    @classmethod
    def exercice_valide(cls, v):
        if len(v.strip()) == 0 or len(v) > 100:
            raise ValueError("Le nom de l'exercice doit faire entre 1 et 100 caractères")
        return v.strip()

    @field_validator('series')
    @classmethod
    def series_valide(cls, v):
        if v <= 0 or v > 100:
            raise ValueError('Le nombre de séries doit être entre 1 et 100')
        return v

    @field_validator('reps')
    @classmethod
    def reps_valide(cls, v):
        if v <= 0 or v > 1000:
            raise ValueError('Le nombre de répétitions doit être entre 1 et 1000')
        return v

    @field_validator('charge')
    @classmethod
    def charge_valide(cls, v):
        if v is not None and (v < 0 or v > 1000):
            raise ValueError('La charge doit être entre 0 et 1000 kg')
        return v

    @field_validator('rpe')
    @classmethod
    def rpe_valide(cls, v):
        if v is not None and (v < 1 or v > 10):
            raise ValueError('Le RPE doit être entre 1 et 10')
        return v

    @field_validator('notes')
    @classmethod
    def notes_valide(cls, v):
        if v is not None and len(v) > 2000:
            raise ValueError('Les notes ne doivent pas dépasser 2000 caractères')
        return v

class SupplementCreate(BaseModel):
    nom: str
    dose: str
    frequence: str
    date_debut: Optional[str] = None
    date_fin: Optional[str] = None
    notes: Optional[str] = None

    @field_validator('nom')
    @classmethod
    def nom_valide(cls, v):
        if len(v.strip()) == 0 or len(v) > 100:
            raise ValueError('Le nom du supplément doit faire entre 1 et 100 caractères')
        return v.strip()

    @field_validator('dose')
    @classmethod
    def dose_valide(cls, v):
        if len(v.strip()) == 0 or len(v) > 50:
            raise ValueError('La dose doit faire entre 1 et 50 caractères')
        return v.strip()

    @field_validator('frequence')
    @classmethod
    def frequence_valide(cls, v):
        if len(v.strip()) == 0 or len(v) > 50:
            raise ValueError('La fréquence doit faire entre 1 et 50 caractères')
        return v.strip()

    @field_validator('date_debut', 'date_fin')
    @classmethod
    def dates_valides(cls, v):
        if v is not None:
            try:
                date.fromisoformat(v)
            except ValueError:
                raise ValueError('Format de date invalide (attendu: YYYY-MM-DD)')
        return v

    @field_validator('notes')
    @classmethod
    def notes_valide(cls, v):
        if v is not None and len(v) > 2000:
            raise ValueError('Les notes ne doivent pas dépasser 2000 caractères')
        return v

class RoutineCreate(BaseModel):
    nom: str
    exercices: str
    updated_at: Optional[str] = None

    @field_validator('nom')
    @classmethod
    def nom_valide(cls, v):
        if len(v.strip()) == 0 or len(v) > 10:
            raise ValueError('Le nom de la routine doit faire entre 1 et 10 caractères')
        return v.strip()

    @field_validator('exercices')
    @classmethod
    def exercices_valide(cls, v):
        if len(v.strip()) == 0 or len(v) > 10000:
            raise ValueError('Les exercices ne doivent pas dépasser 10000 caractères')
        return v

class JournalPhysiologiqueCreate(BaseModel):
    date: str
    texte: str
    humeur: Optional[int] = None
    energie: Optional[int] = None
    sommeil_qualite: Optional[int] = None
    sommeil_duree: Optional[float] = None

    @field_validator('date')
    @classmethod
    def date_valide(cls, v):
        try:
            date.fromisoformat(v)
        except ValueError:
            raise ValueError('Format de date invalide (attendu: YYYY-MM-DD)')
        return v

    @field_validator('texte')
    @classmethod
    def texte_valide(cls, v):
        if len(v.strip()) == 0 or len(v) > 5000:
            raise ValueError('Le texte doit faire entre 1 et 5000 caractères')
        return v

    @field_validator('humeur', 'energie', 'sommeil_qualite')
    @classmethod
    def score_valide(cls, v):
        if v is not None and (v < 1 or v > 10):
            raise ValueError('Le score doit être entre 1 et 10')
        return v

    @field_validator('sommeil_duree')
    @classmethod
    def sommeil_duree_valide(cls, v):
        if v is not None and (v < 0 or v > 24):
            raise ValueError('La durée du sommeil doit être entre 0 et 24 heures')
        return v

# Initialisation de l'application FastAPI
app = FastAPI(
    docs_url=None if os.getenv("ENVIRONMENT") == "production" else "/docs",
    redoc_url=None if os.getenv("ENVIRONMENT") == "production" else "/redoc",
)

# Configuration CORS - origines depuis variable d'environnement
from fastapi.middleware.cors import CORSMiddleware
cors_origins = os.getenv("CORS_ALLOW_ORIGINS", "https://localhost:5173,http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept"],
)

# Middleware pour les en-têtes de sécurité
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    if os.getenv("ENVIRONMENT") == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# Fonction pour obtenir une session de base de données
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Endpoints d'authentification ---
@app.post("/auth/register")
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == user_data.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ce nom d'utilisateur est déjà pris")
    user = User(
        username=user_data.username,
        hashed_password=hash_password(user_data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(data={"sub": user.username})
    return {"access_token": token, "token_type": "bearer"}


@app.post("/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Nom d'utilisateur ou mot de passe incorrect",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token(data={"sub": user.username})
    return {"access_token": token, "token_type": "bearer"}


@app.get("/auth/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {"username": current_user.username, "id": current_user.id}


# Endpoints pour les poids
@app.post("/poids/")
def ajouter_poids(poids_data: PoidsCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
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
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Erreur lors de l'ajout du poids: {e}")
        raise HTTPException(status_code=400, detail="Erreur lors de l'enregistrement du poids.")

@app.get("/poids/")
def lire_poids(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    poids = db.query(Poids).all()
    return {"poids": poids}

@app.get("/poids/{poids_id}")
def lire_poids_par_id(poids_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    poids = db.query(Poids).filter(Poids.id == poids_id).first()
    if not poids:
        raise HTTPException(status_code=404, detail="Mesure de poids non trouvée")
    return {"poids": poids}

@app.put("/poids/{poids_id}")
def mettre_a_jour_poids(poids_id: int, poids_data: PoidsCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        poids = db.query(Poids).filter(Poids.id == poids_id).first()
        if not poids:
            raise HTTPException(status_code=404, detail="Mesure de poids non trouvée")

        poids.valeur = poids_data.valeur
        poids.date = date.fromisoformat(poids_data.date_mesure)
        db.commit()
        db.refresh(poids)
        return {"message": "Mesure de poids mise à jour avec succès !", "poids": poids}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Erreur lors de la mise à jour du poids {poids_id}: {e}")
        raise HTTPException(status_code=400, detail="Erreur lors de la mise à jour du poids.")

@app.delete("/poids/{poids_id}")
def supprimer_poids(poids_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        poids = db.query(Poids).filter(Poids.id == poids_id).first()
        if not poids:
            raise HTTPException(status_code=404, detail="Mesure de poids non trouvée")

        db.delete(poids)
        db.commit()
        return {"message": "Mesure de poids supprimée avec succès !"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Erreur lors de la suppression du poids {poids_id}: {e}")
        raise HTTPException(status_code=400, detail="Erreur lors de la suppression du poids.")

# Endpoints pour les mensurations
@app.post("/mensurations/")
def ajouter_mensuration(mensuration_data: MensurationCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        mensuration_existante = db.query(Mensuration).filter(Mensuration.date == date.fromisoformat(mensuration_data.date_mesure)).first()
        if mensuration_existante:
            # Mettre à jour uniquement les champs fournis
            for key, value in mensuration_data.dict(exclude={'date_mesure'}).items():
                if value is not None:
                    setattr(mensuration_existante, key, value)
            db.commit()
            return {"message": "Mensurations mises à jour avec succès !", "id": mensuration_existante.id}
        else:
            nouvelle_mensuration = Mensuration(
                date=date.fromisoformat(mensuration_data.date_mesure),
                taille=mensuration_data.taille,
                cou=mensuration_data.cou,
                epaules=mensuration_data.epaules,
                poitrine=mensuration_data.poitrine,
                nombril=mensuration_data.nombril,
                hanches=mensuration_data.hanches,
                biceps_gauche=mensuration_data.biceps_gauche,
                biceps_droit=mensuration_data.biceps_droit,
                cuisse_gauche=mensuration_data.cuisse_gauche,
                cuisse_droite=mensuration_data.cuisse_droite,
                mollet_gauche=mensuration_data.mollet_gauche,
                mollet_droit=mensuration_data.mollet_droit
            )
            db.add(nouvelle_mensuration)
            db.commit()
            db.refresh(nouvelle_mensuration)
            return {"message": "Mensurations ajoutées avec succès !", "id": nouvelle_mensuration.id}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Erreur lors de l'ajout de la mensuration: {e}")
        raise HTTPException(status_code=400, detail="Erreur lors de l'enregistrement de la mensuration.")

@app.get("/mensurations/")
def lire_mensurations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    mensurations = db.query(Mensuration).all()
    return {"mensurations": mensurations}

@app.get("/mensurations/{mensuration_id}")
def lire_mensuration_par_id(mensuration_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    mensuration = db.query(Mensuration).filter(Mensuration.id == mensuration_id).first()
    if not mensuration:
        raise HTTPException(status_code=404, detail="Mensuration non trouvée")
    return {"mensuration": mensuration}

@app.put("/mensurations/{mensuration_id}")
def mettre_a_jour_mensuration(mensuration_id: int, mensuration_data: MensurationCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        mensuration = db.query(Mensuration).filter(Mensuration.id == mensuration_id).first()
        if not mensuration:
            raise HTTPException(status_code=404, detail="Mensuration non trouvée")
        
        mensuration.date = date.fromisoformat(mensuration_data.date_mesure)
        for key, value in mensuration_data.dict(exclude={'date_mesure'}).items():
            setattr(mensuration, key, value)
        
        db.commit()
        db.refresh(mensuration)
        return {"message": "Mensuration mise à jour avec succès !", "mensuration": mensuration}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Erreur lors de la mise à jour de la mensuration {mensuration_id}: {e}")
        raise HTTPException(status_code=400, detail="Erreur lors de la mise à jour de la mensuration.")

@app.delete("/mensurations/{mensuration_id}")
def supprimer_mensuration(mensuration_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        mensuration = db.query(Mensuration).filter(Mensuration.id == mensuration_id).first()
        if not mensuration:
            raise HTTPException(status_code=404, detail="Mensuration non trouvée")

        db.delete(mensuration)
        db.commit()
        return {"message": "Mensuration supprimée avec succès !"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Erreur lors de la suppression de la mensuration {mensuration_id}: {e}")
        raise HTTPException(status_code=400, detail="Erreur lors de la suppression de la mensuration.")

# Endpoints pour les entraînements
@app.post("/entrainements/")
def ajouter_entrainement(entrainement_data: EntrainementCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        nouvel_entrainement = Entrainement(
            date=date.fromisoformat(entrainement_data.date),
            exercice=entrainement_data.exercice,
            series=entrainement_data.series,
            reps=entrainement_data.reps,
            charge=entrainement_data.charge,
            rpe=entrainement_data.rpe,
            notes=entrainement_data.notes
        )
        db.add(nouvel_entrainement)
        db.commit()
        db.refresh(nouvel_entrainement)
        return {"message": "Entraînement ajouté avec succès !", "id": nouvel_entrainement.id}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Erreur lors de l'ajout de l'entraînement: {e}")
        raise HTTPException(status_code=400, detail="Erreur lors de l'enregistrement de l'entraînement.")

@app.get("/entrainements/")
def lire_entrainements(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    entrainements = db.query(Entrainement).all()
    return {"entrainements": entrainements}

@app.get("/entrainements/{entrainement_id}")
def lire_entrainement_par_id(entrainement_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    entrainement = db.query(Entrainement).filter(Entrainement.id == entrainement_id).first()
    if not entrainement:
        raise HTTPException(status_code=404, detail="Entraînement non trouvé")
    return {"entrainement": entrainement}

@app.put("/entrainements/{entrainement_id}")
def mettre_a_jour_entrainement(entrainement_id: int, entrainement_data: EntrainementCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        entrainement = db.query(Entrainement).filter(Entrainement.id == entrainement_id).first()
        if not entrainement:
            raise HTTPException(status_code=404, detail="Entraînement non trouvé")
        
        entrainement.date = date.fromisoformat(entrainement_data.date)
        entrainement.exercice = entrainement_data.exercice
        entrainement.series = entrainement_data.series
        entrainement.reps = entrainement_data.reps
        entrainement.charge = entrainement_data.charge
        entrainement.rpe = entrainement_data.rpe
        entrainement.notes = entrainement_data.notes
        
        db.commit()
        db.refresh(entrainement)
        return {"message": "Entraînement mis à jour avec succès !", "entrainement": entrainement}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Erreur lors de la mise à jour de l'entraînement {entrainement_id}: {e}")
        raise HTTPException(status_code=400, detail="Erreur lors de la mise à jour de l'entraînement.")

@app.delete("/entrainements/{entrainement_id}")
def supprimer_entrainement(entrainement_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        entrainement = db.query(Entrainement).filter(Entrainement.id == entrainement_id).first()
        if not entrainement:
            raise HTTPException(status_code=404, detail="Entraînement non trouvé")

        db.delete(entrainement)
        db.commit()
        return {"message": "Entraînement supprimé avec succès !"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Erreur lors de la suppression de l'entraînement {entrainement_id}: {e}")
        raise HTTPException(status_code=400, detail="Erreur lors de la suppression de l'entraînement.")

# Endpoints pour les suppléments
@app.post("/supplements/")
def ajouter_supplement(supplement_data: SupplementCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        date_debut = None
        date_fin = None
        
        if supplement_data.date_debut:
            date_debut = date.fromisoformat(supplement_data.date_debut)
        if supplement_data.date_fin:
            date_fin = date.fromisoformat(supplement_data.date_fin)
        
        nouveau_supplement = Supplement(
            nom=supplement_data.nom,
            dose=supplement_data.dose,
            frequence=supplement_data.frequence,
            date_debut=date_debut,
            date_fin=date_fin,
            notes=supplement_data.notes
        )
        db.add(nouveau_supplement)
        db.commit()
        db.refresh(nouveau_supplement)
        return {"message": "Supplément ajouté avec succès !", "id": nouveau_supplement.id}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Erreur lors de l'ajout du supplément: {e}")
        raise HTTPException(status_code=400, detail="Erreur lors de l'enregistrement du supplément.")

@app.get("/supplements/")
def lire_supplements(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    supplements = db.query(Supplement).all()
    return {"supplements": supplements}

@app.get("/supplements/{supplement_id}")
def lire_supplement_par_id(supplement_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    supplement = db.query(Supplement).filter(Supplement.id == supplement_id).first()
    if not supplement:
        raise HTTPException(status_code=404, detail="Supplément non trouvé")
    return {"supplement": supplement}

@app.put("/supplements/{supplement_id}")
def mettre_a_jour_supplement(supplement_id: int, supplement_data: SupplementCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        supplement = db.query(Supplement).filter(Supplement.id == supplement_id).first()
        if not supplement:
            raise HTTPException(status_code=404, detail="Supplément non trouvé")
        
        supplement.nom = supplement_data.nom
        supplement.dose = supplement_data.dose
        supplement.frequence = supplement_data.frequence
        
        if supplement_data.date_debut:
            supplement.date_debut = date.fromisoformat(supplement_data.date_debut)
        else:
            supplement.date_debut = None
            
        if supplement_data.date_fin:
            supplement.date_fin = date.fromisoformat(supplement_data.date_fin)
        else:
            supplement.date_fin = None
            
        supplement.notes = supplement_data.notes
        
        db.commit()
        db.refresh(supplement)
        return {"message": "Supplément mis à jour avec succès !", "supplement": supplement}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Erreur lors de la mise à jour du supplément {supplement_id}: {e}")
        raise HTTPException(status_code=400, detail="Erreur lors de la mise à jour du supplément.")

@app.delete("/supplements/{supplement_id}")
def supprimer_supplement(supplement_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        supplement = db.query(Supplement).filter(Supplement.id == supplement_id).first()
        if not supplement:
            raise HTTPException(status_code=404, detail="Supplément non trouvé")

        db.delete(supplement)
        db.commit()
        return {"message": "Supplément supprimé avec succès !"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Erreur lors de la suppression du supplément {supplement_id}: {e}")
        raise HTTPException(status_code=400, detail="Erreur lors de la suppression du supplément.")

# Endpoints pour le journal physiologique
@app.post("/journal/")
def ajouter_journal(journal_data: JournalPhysiologiqueCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        nouvel_entree = JournalPhysiologique(
            date=date.fromisoformat(journal_data.date),
            texte=journal_data.texte,
            humeur=journal_data.humeur,
            energie=journal_data.energie,
            sommeil_qualite=journal_data.sommeil_qualite,
            sommeil_duree=journal_data.sommeil_duree
        )
        db.add(nouvel_entree)
        db.commit()
        db.refresh(nouvel_entree)
        return {"message": "Entrée de journal ajoutée avec succès !", "id": nouvel_entree.id}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Erreur lors de l'ajout du journal: {e}")
        raise HTTPException(status_code=400, detail="Erreur lors de l'enregistrement du journal.")

@app.get("/journal/")
def lire_journal(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    entrees = db.query(JournalPhysiologique).all()
    return {"journal": entrees}

@app.get("/journal/{journal_id}")
def lire_journal_par_id(journal_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    entree = db.query(JournalPhysiologique).filter(JournalPhysiologique.id == journal_id).first()
    if not entree:
        raise HTTPException(status_code=404, detail="Entrée de journal non trouvée")
    return {"entree": entree}

@app.put("/journal/{journal_id}")
def mettre_a_jour_journal(journal_id: int, journal_data: JournalPhysiologiqueCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        entree = db.query(JournalPhysiologique).filter(JournalPhysiologique.id == journal_id).first()
        if not entree:
            raise HTTPException(status_code=404, detail="Entrée de journal non trouvée")
        
        entree.date = date.fromisoformat(journal_data.date)
        entree.texte = journal_data.texte
        entree.humeur = journal_data.humeur
        entree.energie = journal_data.energie
        entree.sommeil_qualite = journal_data.sommeil_qualite
        entree.sommeil_duree = journal_data.sommeil_duree
        
        db.commit()
        db.refresh(entree)
        return {"message": "Entrée de journal mise à jour avec succès !", "entree": entree}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Erreur lors de la mise à jour du journal {journal_id}: {e}")
        raise HTTPException(status_code=400, detail="Erreur lors de la mise à jour du journal.")

@app.delete("/journal/{journal_id}")
def supprimer_journal(journal_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        entree = db.query(JournalPhysiologique).filter(JournalPhysiologique.id == journal_id).first()
        if not entree:
            raise HTTPException(status_code=404, detail="Entrée de journal non trouvée")

        db.delete(entree)
        db.commit()
        return {"message": "Entrée de journal supprimée avec succès !"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Erreur lors de la suppression du journal {journal_id}: {e}")
        raise HTTPException(status_code=400, detail="Erreur lors de la suppression du journal.")

# Endpoints pour les routines
@app.get("/routines/")
def lire_routines(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    routines = db.query(Routine).all()
    return {"routines": routines}

@app.post("/routines/")
def ajouter_routine(routine_data: RoutineCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        routine_existante = db.query(Routine).filter(Routine.nom == routine_data.nom).first()
        if routine_existante:
            routine_existante.exercices = routine_data.exercices
            routine_existante.updated_at = date.today()
            db.commit()
            return {"message": "Routine mise à jour avec succès !", "id": routine_existante.id}
        else:
            nouvelle_routine = Routine(
                nom=routine_data.nom,
                exercices=routine_data.exercices,
                updated_at=date.today()
            )
            db.add(nouvelle_routine)
            db.commit()
            db.refresh(nouvelle_routine)
            return {"message": "Routine ajoutée avec succès !", "id": nouvelle_routine.id}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Erreur lors de l'ajout de la routine: {e}")
        raise HTTPException(status_code=400, detail="Erreur lors de l'enregistrement de la routine.")

@app.put("/routines/{routine_id}")
def mettre_a_jour_routine(routine_id: int, routine_data: RoutineCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        routine = db.query(Routine).filter(Routine.id == routine_id).first()
        if not routine:
            raise HTTPException(status_code=404, detail="Routine non trouvée")
        routine.nom = routine_data.nom
        routine.exercices = routine_data.exercices
        routine.updated_at = date.today()
        db.commit()
        db.refresh(routine)
        return {"message": "Routine mise à jour avec succès !", "routine": routine}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Erreur lors de la mise à jour de la routine {routine_id}: {e}")
        raise HTTPException(status_code=400, detail="Erreur lors de la mise à jour de la routine.")

@app.delete("/routines/{routine_id}")
def supprimer_routine(routine_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        routine = db.query(Routine).filter(Routine.id == routine_id).first()
        if not routine:
            raise HTTPException(status_code=404, detail="Routine non trouvée")
        db.delete(routine)
        db.commit()
        return {"message": "Routine supprimée avec succès !"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Erreur lors de la suppression de la routine {routine_id}: {e}")
        raise HTTPException(status_code=400, detail="Erreur lors de la suppression de la routine.")

@app.get("/")
def read_root():
    return {"message": "Bienvenue sur l'API de suivi de transformation physique !"}

@app.get("/export-csv/")
def export_csv(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Exporte toutes les données de poids et mensurations au format CSV.
    
    Retourne un fichier CSV téléchargeable avec les colonnes :
    - date: Date de la mesure
    - poids: Valeur du poids
    - taille: Valeur de la taille
    - bras: Valeur des bras
    - cuisses: Valeur des cuisses
    """
    try:
        # Récupérer toutes les données
        poids_data = db.query(Poids).all()
        mensurations_data = db.query(Mensuration).all()
        
        # Créer un dictionnaire pour stocker les données combinées par date
        data_by_date = {}
        
        # Ajouter les données de poids
        for poids in poids_data:
            date_str = poids.date.isoformat()
            if date_str not in data_by_date:
                data_by_date[date_str] = {'date': date_str, 'poids': None}
            data_by_date[date_str]['poids'] = poids.valeur
        
        # Ajouter les données de mensurations
        for mensuration in mensurations_data:
            date_str = mensuration.date.isoformat()
            if date_str not in data_by_date:
                data_by_date[date_str] = {'date': date_str, 'poids': None}
            
            # Ajouter toutes les mensurations
            if mensuration.taille is not None:
                data_by_date[date_str]['taille'] = mensuration.taille
            if mensuration.cou is not None:
                data_by_date[date_str]['cou'] = mensuration.cou
            if mensuration.epaules is not None:
                data_by_date[date_str]['epaules'] = mensuration.epaules
            if mensuration.poitrine is not None:
                data_by_date[date_str]['poitrine'] = mensuration.poitrine
            if mensuration.nombril is not None:
                data_by_date[date_str]['nombril'] = mensuration.nombril
            if mensuration.hanches is not None:
                data_by_date[date_str]['hanches'] = mensuration.hanches
            if mensuration.biceps_gauche is not None:
                data_by_date[date_str]['biceps_gauche'] = mensuration.biceps_gauche
            if mensuration.biceps_droit is not None:
                data_by_date[date_str]['biceps_droit'] = mensuration.biceps_droit
            if mensuration.cuisse_gauche is not None:
                data_by_date[date_str]['cuisse_gauche'] = mensuration.cuisse_gauche
            if mensuration.cuisse_droite is not None:
                data_by_date[date_str]['cuisse_droite'] = mensuration.cuisse_droite
            if mensuration.mollet_gauche is not None:
                data_by_date[date_str]['mollet_gauche'] = mensuration.mollet_gauche
            if mensuration.mollet_droit is not None:
                data_by_date[date_str]['mollet_droit'] = mensuration.mollet_droit
        
        # Créer le fichier CSV en mémoire
        output = io.StringIO(newline='')
        
        # Déterminer tous les champs possibles
        all_fields = ['date', 'poids', 'taille', 'cou', 'epaules', 'poitrine', 'nombril', 'hanches',
                     'biceps_gauche', 'biceps_droit', 'cuisse_gauche', 'cuisse_droite',
                     'mollet_gauche', 'mollet_droit']
        
        writer = csv.DictWriter(output, fieldnames=all_fields, lineterminator='\n')
        
        writer.writeheader()
        for date_str in sorted(data_by_date.keys()):
            writer.writerow(data_by_date[date_str])
        
        # Préparer la réponse
        response = Response(content=output.getvalue(), media_type="text/csv")
        response.headers["Content-Disposition"] = "attachment; filename=donnees_transformation.csv"
        
        return response
        
    except Exception as e:
        logger.error(f"Erreur lors de l'export CSV: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de l'export CSV.")

class AnalyseRequest(BaseModel):
    """Requête d'analyse IA des données de transformation."""
    user_prompt: str = "Analyse mes données de transformation physique et donne-moi des conseils personnalisés"

@app.post("/analyse/", tags=["Analyse IA"], summary="Analyse personnalisée via Mistral AI",
          response_description="Analyse détaillée et conseils basés sur vos données")
async def analyse(
    request_data: AnalyseRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Analyse les données de transformation physique avec l'API Mistral AI.

    Récupère automatiquement toutes les données (poids, mensurations, entraînements, journal)
    et les envoie à Mistral pour obtenir une analyse personnalisée.

    - **user_prompt** : question ou demande d'analyse personnalisée (optionnel)
    """
    # Vérifier la clé API
    api_key = os.getenv("MISTRAL_API_KEY")
    if not api_key or api_key == "votre_cle_api_mistral_ici":
        raise HTTPException(status_code=500, detail="Clé API Mistral non configurée côté serveur.")

    # Récupérer toutes les données
    poids_list = db.query(Poids).order_by(Poids.date).all()
    mensurations = db.query(Mensuration).order_by(Mensuration.date).all()
    entrainements = db.query(Entrainement).order_by(Entrainement.date).all()
    journal_entries = db.query(JournalPhysiologique).order_by(JournalPhysiologique.date).all()

    # Formater les données
    data = {
        "poids": [{"date": p.date.isoformat(), "valeur_kg": p.valeur} for p in poids_list],
        "mensurations": [
            {
                "date": m.date.isoformat(),
                "taille": m.taille, "cou": m.cou, "epaules": m.epaules,
                "poitrine": m.poitrine, "nombril": m.nombril, "hanches": m.hanches,
                "biceps_gauche": m.biceps_gauche, "biceps_droit": m.biceps_droit,
                "cuisse_gauche": m.cuisse_gauche, "cuisse_droite": m.cuisse_droite,
                "mollet_gauche": m.mollet_gauche, "mollet_droit": m.mollet_droit,
            }
            for m in mensurations
        ],
        "entrainements": [
            {
                "date": e.date.isoformat(), "exercice": e.exercice,
                "series": e.series, "reps": e.reps,
                "charge_kg": e.charge, "rpe": e.rpe, "notes": e.notes,
            }
            for e in entrainements
        ],
        "journal": [
            {
                "date": j.date.isoformat(), "texte": j.texte,
                "humeur": j.humeur, "energie": j.energie,
                "sommeil_qualite": j.sommeil_qualite, "sommeil_duree_h": j.sommeil_duree,
            }
            for j in journal_entries
        ],
    }

    # Construire le prompt
    prompt = (
        f"{request_data.user_prompt}\n\n"
        f"Voici les données de transformation physique au format JSON :\n"
        f"{json.dumps(data, ensure_ascii=False, indent=2)}\n\n"
        f"Fournis une analyse détaillée avec des tendances, points forts, "
        f"points d'amélioration et conseils personnalisés."
    )

    # Appel à l'API Mistral
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": "mistral-small-latest",
        "messages": [
            {"role": "system", "content": "Tu es un coach sportif et nutritionniste expert. Réponds en français."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.7,
        "max_tokens": 2000,
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://api.mistral.ai/v1/chat/completions",
                headers=headers,
                json=payload,
            )
        response.raise_for_status()
        result = response.json()
    except httpx.HTTPStatusError as e:
        logger.error(f"Erreur HTTP Mistral ({e.response.status_code}): {e.response.text}")
        raise HTTPException(status_code=502, detail="Erreur lors de la communication avec le service d'analyse IA.")
    except httpx.RequestError as e:
        logger.error(f"Erreur de connexion Mistral: {e}")
        raise HTTPException(status_code=503, detail="Service d'analyse IA temporairement indisponible.")

    # Extraire le texte de la réponse
    analyse_text = result["choices"][0]["message"]["content"]

    return {
        "analyse": analyse_text,
        "model": result.get("model"),
        "usage": result.get("usage"),
        "data_summary": {
            "poids_count": len(poids_list),
            "mensurations_count": len(mensurations),
            "entrainements_count": len(entrainements),
            "journal_count": len(journal_entries),
        },
    }


if __name__ == "__main__":
    import uvicorn
    from pathlib import Path

    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))

    certs_dir = Path(__file__).resolve().parent.parent / "certs"
    ssl_keyfile = certs_dir / "key.pem"
    ssl_certfile = certs_dir / "cert.pem"

    ssl_kwargs = {}
    if ssl_certfile.exists() and ssl_keyfile.exists():
        ssl_kwargs["ssl_keyfile"] = str(ssl_keyfile)
        ssl_kwargs["ssl_certfile"] = str(ssl_certfile)
        logger.info("HTTPS activé avec les certificats de %s", certs_dir)
    else:
        logger.warning("Certificats SSL non trouvés dans %s — démarrage en HTTP", certs_dir)

    uvicorn.run("main:app", host=host, port=port, reload=True, **ssl_kwargs)
