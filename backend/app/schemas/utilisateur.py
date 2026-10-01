from pydantic import BaseModel, ConfigDict

from app.models.utilisateur import RoleUtilisateur


class UtilisateurBase(BaseModel):
    identifiant: str
    nom: str
    prenom: str
    role: RoleUtilisateur


class UtilisateurCreation(UtilisateurBase):
    """Payload pour la creation d'un compte par le RSI (Gerer les comptes des utilisateurs)."""
    mdp: str


class UtilisateurMiseAJour(BaseModel):
    """Payload pour la mise a jour d'un compte (infos et/ou role -> Gerer acces et roles)."""
    nom: str | None = None
    prenom: str | None = None
    role: RoleUtilisateur | None = None
    actif: bool | None = None


class UtilisateurLecture(UtilisateurBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    actif: bool
