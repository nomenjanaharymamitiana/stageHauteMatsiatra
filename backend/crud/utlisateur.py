import bcrypt
from sqlalchemy.orm import Session
from models.utilisateur import Utilisateur
from schemas.utlisateur import UtilisateurUpdate, PasswordChange


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password:
        return False

    # Encodage en bytes (tronquage manuel de sécurité à 72 octets pour bcrypt)
    plain_bytes = plain_password.encode('utf-8')[:72]

    # Vérification si le mot de passe stocké est un hash bcrypt ($2b$ ou $2a$)
    if hashed_password.startswith(("$2b$", "$2a$", "$2y$")):
        try:
            return bcrypt.checkpw(plain_bytes, hashed_password.encode('utf-8'))
        except Exception:
            return False
            
    # Fallback pour les anciens comptes enregistrés en texte clair en BDD
    return plain_password == hashed_password


def hash_password(password: str) -> str:
    # bcrypt nécessite des bytes et un mot de passe <= 72 octets
    password_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password_bytes, salt).decode('utf-8')


def get_utilisateur_by_im(db: Session, im: str) -> Utilisateur:
    return db.query(Utilisateur).filter(Utilisateur.im == im).first()


def update_utilisateur_info(db: Session, im: str, data: UtilisateurUpdate) -> Utilisateur:
    db_user = get_utilisateur_by_im(db, im)
    if not db_user:
        return None

    if data.nom is not None:
        db_user.nom = data.nom
    if data.prenom is not None:
        db_user.prenom = data.prenom

    db.commit()
    return db_user


def update_utilisateur_password(db: Session, im: str, password_data: PasswordChange):
    db_user = get_utilisateur_by_im(db, im)
    if not db_user:
        return {"error": "not_found"}

    # Vérification de l'ancien mot de passe (haché ou texte clair)
    if not verify_password(password_data.old_password, db_user.mdp):
        return {"error": "invalid_password"}

    # Hachage du nouveau mot de passe avec bcrypt direct
    db_user.mdp = hash_password(password_data.new_password)
    db.commit()
    return {"success": True}