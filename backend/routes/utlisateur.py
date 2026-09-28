from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
import crud.utlisateur as crud_user
import schemas.utlisateur as schemas_user

router = APIRouter(
    prefix="/api/v1/users",
    tags=["Utilisateurs"]
)

# Fonction de dépendance pour obtenir l'utilisateur courant via X-User-IM ou Authorization
def get_current_user_im(
    authorization: Optional[str] = Header(None),
    x_user_im: Optional[str] = Header(None)
) -> str:
    user_im = x_user_im or (authorization.replace("Bearer ", "") if authorization else None)
    if not user_im:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Identifiant (IM) manquant dans les en-têtes"
        )
    return user_im


# Endpoint 1 : Mise à jour des informations de l'utilisateur (nom, prénom)
@router.put("/me", response_model=schemas_user.UtilisateurOut)
def update_profile(
    user_data: schemas_user.UtilisateurUpdate,
    db: Session = Depends(get_db),
    current_im: str = Depends(get_current_user_im)
):
    updated_user = crud_user.update_utilisateur_info(db, current_im, user_data)
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur introuvable"
        )
    return updated_user


# Endpoint 2 : Changement de mot de passe
@router.put("/change-password")
def change_password(
    password_data: schemas_user.PasswordChange,
    db: Session = Depends(get_db),
    current_im: str = Depends(get_current_user_im)
):
    if len(password_data.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le nouveau mot de passe doit contenir au moins 6 caractères"
        )

    res = crud_user.update_utilisateur_password(db, current_im, password_data)
    
    if "error" in res:
        if res["error"] == "not_found":
            raise HTTPException(status_code=404, detail="Utilisateur introuvable")
        if res["error"] == "invalid_password":
            raise HTTPException(status_code=400, detail="Mot de passe actuel incorrect")

    return {"message": "Mot de passe modifié avec succès"}