from sqlalchemy import create_engine, Column, Integer, Float, String, Date, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship

SQLALCHEMY_DATABASE_URL = "sqlite:///./transformation.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)


class Poids(Base):
    __tablename__ = "poids"
    id = Column(Integer, primary_key=True, index=True)
    valeur = Column(Float, nullable=False)
    date = Column(Date, unique=True, index=True)

class Mensuration(Base):
    __tablename__ = "mensurations"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, unique=True, index=True)
    
    # Mensurations principales
    taille = Column(Float, nullable=True, comment="Tour de taille en cm")
    cou = Column(Float, nullable=True, comment="Tour de cou en cm")
    epaules = Column(Float, nullable=True, comment="Tour d'épaules en cm")
    poitrine = Column(Float, nullable=True, comment="Tour de poitrine en cm")
    nombril = Column(Float, nullable=True, comment="Tour de nombril en cm")
    hanches = Column(Float, nullable=True, comment="Tour de hanches en cm")
    
    # Bras
    biceps_gauche = Column(Float, nullable=True, comment="Tour de biceps gauche en cm")
    biceps_droit = Column(Float, nullable=True, comment="Tour de biceps droit en cm")
    
    # Cuisses
    cuisse_gauche = Column(Float, nullable=True, comment="Tour de cuisse gauche en cm")
    cuisse_droite = Column(Float, nullable=True, comment="Tour de cuisse droite en cm")
    
    # Mollets
    mollet_gauche = Column(Float, nullable=True, comment="Tour de mollet gauche en cm")
    mollet_droit = Column(Float, nullable=True, comment="Tour de mollet droit en cm")

class Entrainement(Base):
    __tablename__ = "entrainements"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, index=True)
    exercice = Column(String(100), nullable=False, comment="Nom de l'exercice")
    series = Column(Integer, nullable=False, comment="Nombre de séries")
    reps = Column(Integer, nullable=False, comment="Nombre de répétitions")
    charge = Column(Float, nullable=True, comment="Charge en kg")
    rpe = Column(Float, nullable=True, comment="RPE (Rate of Perceived Exertion) de 1 à 10")
    notes = Column(Text, nullable=True, comment="Notes supplémentaires")

class Supplement(Base):
    __tablename__ = "supplements"
    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(100), nullable=False, comment="Nom du supplément")
    dose = Column(String(50), nullable=False, comment="Dose (ex: 5g, 200mg)")
    frequence = Column(String(50), nullable=False, comment="Fréquence (ex: 2x/jour, 1x/semaine)")
    date_debut = Column(Date, nullable=True, comment="Date de début de prise")
    date_fin = Column(Date, nullable=True, comment="Date de fin de prise")
    notes = Column(Text, nullable=True, comment="Notes supplémentaires")

class Routine(Base):
    __tablename__ = "routines"
    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(10))
    exercices = Column(Text)
    updated_at = Column(Date)

class JournalPhysiologique(Base):
    __tablename__ = "journal_physiologique"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, index=True)
    texte = Column(Text, nullable=False, comment="Texte libre pour le journal")
    humeur = Column(Integer, nullable=True, comment="Niveau d'humeur de 1 à 10")
    energie = Column(Integer, nullable=True, comment="Niveau d'énergie de 1 à 10")
    sommeil_qualite = Column(Integer, nullable=True, comment="Qualité du sommeil de 1 à 10")
    sommeil_duree = Column(Float, nullable=True, comment="Durée du sommeil en heures")

# Créer toutes les tables
Base.metadata.create_all(bind=engine)
