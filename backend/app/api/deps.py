from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.security import decoder_token
from app.crud.utilisateur import obtenir_par_identifiant
from app.db.session import get_db
from app.models.utilisateur import RoleUtilisateur, Utilisateur

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def obtenir_utilisateur_courant(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> Utilisateur:
    """Decode le token JWT et retourne l'utilisateur authentifie (cas 'S'authentifier')."""
    exception_auth = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Identifiants invalides ou session expiree",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decoder_token(token)
        identifiant: str | None = payload.get("sub")
        if identifiant is None:
            raise exception_auth
    except JWTError:
        raise exception_auth

    utilisateur = obtenir_par_identifiant(db, identifiant)
    if utilisateur is None or not utilisateur.actif:
        raise exception_auth
    return utilisateur


def exiger_role_rsi(utilisateur: Utilisateur = Depends(obtenir_utilisateur_courant)) -> Utilisateur:
    """Protege toutes les routes reservees a l'administrateur (RSI)."""
    if utilisateur.role != RoleUtilisateur.RSI:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acces reserve au RSI",
        )
    return utilisateur


def exiger_role_dagrh(utilisateur: Utilisateur = Depends(obtenir_utilisateur_courant)) -> Utilisateur:
    """Protege les routes reservees au DAG/RH (cote client : documents)."""
    if utilisateur.role != RoleUtilisateur.DAG_RH:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acces reserve au DAG/RH",
        )
    return utilisateur
