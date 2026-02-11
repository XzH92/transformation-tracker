from sqlalchemy import create_engine, Column, Integer, String, Float, Date
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Chemin vers la base de données SQLite
DATABASE_URL = "sqlite:///./transformation.db"

# Création du moteur de base de données
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# Création de la session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base pour les modèles
Base = declarative_base()

# Modèle pour les données de poids
class Poids(Base):
    __tablename__ = "poids"
    id = Column(Integer, primary_key=True, index=True)
    valeur = Column(Float, index=True)
    date = Column(Date, unique=True, index=True)

# Création des tables
Base.metadata.create_all(bind=engine)
