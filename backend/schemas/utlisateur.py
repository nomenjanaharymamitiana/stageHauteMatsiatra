from pydantic import BaseModel
from typing import Optional

# Schéma pour mettre à jour les informations (Nom, Prénom)
class UtilisateurUpdate(BaseModel):
    nom: Optional[str] = None
    prenom: Optional[str] = None

# Schéma pour le changement de mot de passe
class PasswordChange(BaseModel):
    old_password: str
    new_password: str

# Schéma pour retourner les données de l'utilisateur
class UtilisateurOut(BaseModel):
    im: str
    nom: str
    prenom: str
    type_user: Optional[str] = None

    class Config:
        from_attributes = True