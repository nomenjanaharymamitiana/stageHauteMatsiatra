from pydantic import BaseModel


class UtilisateurCreation(BaseModel):
    """Payload pour la creation d'un compte par le RSI."""
    im: str
    nom: str
    prenom: str
    mdp: str
    type_user: str  # "dag_rh" ou "rsi"


class RoleMiseAJour(BaseModel):
    type_user: str  # "dag_rh" ou "rsi"
