from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import creer_token_acces
from app.crud.utilisateur import authenticate
from app.db.session import get_db
from app.schemas.auth import LoginRequest, Token

router = APIRouter(prefix="/api/v1/auth", tags=["Authentification"])


@router.post("/login", response_model=Token)
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    """Cas d'utilisation : S'authentifier."""
    utilisateur = authenticate(db, credentials.im, credentials.mdp)
    if not utilisateur:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Matricule ou mot de passe incorrect.",
        )
    if not utilisateur.actif:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ce compte a ete desactive")

    token = creer_token_acces(sub=utilisateur.im, role=utilisateur.type_user)
    return Token(access_token=token)
