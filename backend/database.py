from sqlalchemy import create_engine, Column, Integer, Float, Date
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./transformation.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Poids(Base):
    __tablename__ = "poids"
    id = Column(Integer, primary_key=True, index=True)
    valeur = Column(Float, nullable=False)
    date = Column(Date, unique=True, index=True)

class Mensuration(Base):
    __tablename__ = "mensurations"
    id = Column(Integer, primary_key=True, index=True)
    taille = Column(Float, nullable=True)
    bras = Column(Float, nullable=True)
    cuisses = Column(Float, nullable=True)
    date = Column(Date, unique=True, index=True)

Base.metadata.create_all(bind=engine)
