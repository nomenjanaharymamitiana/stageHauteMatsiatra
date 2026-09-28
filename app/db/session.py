from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """Dependance FastAPI : fournit une session DB et la ferme apres la requete."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
