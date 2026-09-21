from sqlalchemy.orm import Session
import models
import schemas

def get_user_by_im(db: Session, im: str):
    return db.query(models.Utilisateur).filter(models.Utilisateur.im == im).first()

def authenticate_user(db: Session, credentials: schemas.LoginRequest):
    user = get_user_by_im(db, credentials.im)
    if not user or user.mdp != credentials.mdp:
        return None
    return user