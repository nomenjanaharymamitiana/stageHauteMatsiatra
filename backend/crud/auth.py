from sqlalchemy.orm import Session
import models
import schemas
from passlib.context import CryptContext

# Configuration du hachage de mot de passe (si tu utilises passlib/bcrypt)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_user_by_im(db: Session, im: str):
    return db.query(models.Utilisateur).filter(models.Utilisateur.im == im).first()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Si tes mots de passe sont hachés :
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        # En fallback si le mot de passe en BDD est en clair (durant la phase de dev)
        return plain_password == hashed_password

def authenticate_user(db: Session, credentials: schemas.LoginRequest):
    user = get_user_by_im(db, credentials.im)
    if not user:
        return None
    
    # Vérification du mot de passe
    if not verify_password(credentials.mdp, user.mdp):
        return None

    return user