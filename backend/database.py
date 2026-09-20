from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# URL de connexion : postgresql://utilisateur:mot_de_passe@hote:port/nom_base
DATABASE_URL = "postgresql://postgres:allerenavant@localhost:5433/ged_db"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dépendance pour obtenir la session de BDD dans les routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
