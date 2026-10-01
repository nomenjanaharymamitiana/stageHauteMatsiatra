from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import creer_token_acces, verifier_mot_de_passe
from app.crud.utilisateur import obtenir_par_identifiant
from app.db.session import get_db
from app.schemas.auth import ConnexionPayload, Token

router = APIRouter(prefix="/auth", tags=["Authentification"])


@router.post("/login", response_model=Token)
def se_connecter(payload: ConnexionPayload, db: Session = Depends(get_db)):
    """Cas d'utilisation : S'authentifier (inclus par tous les autres cas)."""
    utilisateur = obtenir_par_identifiant(db, payload.identifiant)

    if utilisateur is None or not verifier_mot_de_passe(payload.mdp, utilisateur.mdp_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Identifiant ou mot de passe incorrect",
        )

    if not utilisateur.actif:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ce compte a ete desactive",
        )

    token = creer_token_acces(sub=utilisateur.identifiant, role=utilisateur.role.value)
    return Token(access_token=token)
