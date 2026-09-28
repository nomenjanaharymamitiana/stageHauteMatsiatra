from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.security import decoder_token
from app.crud.utilisateur import get_by_im
from app.db.session import get_db
from app.models.utilisateur import Utilisateur

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def obtenir_utilisateur_courant(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> Utilisateur:
    """Decode le token JWT et retourne l'utilisateur authentifie (S'authentifier)."""
    exception_auth = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Identifiants invalides ou session expiree",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decoder_token(token)
        im: str | None = payload.get("sub")
        if im is None:
            raise exception_auth
    except JWTError:
        raise exception_auth

    utilisateur = get_by_im(db, im)
    if utilisateur is None or not utilisateur.actif:
        raise exception_auth
    return utilisateur


def exiger_role_rsi(utilisateur: Utilisateur = Depends(obtenir_utilisateur_courant)) -> Utilisateur:
    if utilisateur.type_user != "rsi":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acces reserve au RSI")
    return utilisateur


def exiger_role_dagrh(utilisateur: Utilisateur = Depends(obtenir_utilisateur_courant)) -> Utilisateur:
    if utilisateur.type_user != "dag_rh":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acces reserve au DAG/RH")
    return utilisateur
