from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hacher_mot_de_passe
from app.models.utilisateur import Utilisateur
from app.schemas.utilisateur import UtilisateurCreation, UtilisateurMiseAJour


def obtenir_par_identifiant(db: Session, identifiant: str) -> Utilisateur | None:
    return db.scalar(select(Utilisateur).where(Utilisateur.identifiant == identifiant))


def obtenir_par_id(db: Session, utilisateur_id: int) -> Utilisateur | None:
    return db.get(Utilisateur, utilisateur_id)


def lister(db: Session, skip: int = 0, limit: int = 100) -> list[Utilisateur]:
    return list(db.scalars(select(Utilisateur).offset(skip).limit(limit)))


def creer(db: Session, payload: UtilisateurCreation) -> Utilisateur:
    utilisateur = Utilisateur(
        identifiant=payload.identifiant,
        nom=payload.nom,
        prenom=payload.prenom,
        mdp_hash=hacher_mot_de_passe(payload.mdp),
        role=payload.role,
    )
    db.add(utilisateur)
    db.commit()
    db.refresh(utilisateur)
    return utilisateur


def mettre_a_jour(db: Session, utilisateur: Utilisateur, payload: UtilisateurMiseAJour) -> Utilisateur:
    donnees = payload.model_dump(exclude_unset=True)
    for champ, valeur in donnees.items():
        setattr(utilisateur, champ, valeur)
    db.commit()
    db.refresh(utilisateur)
    return utilisateur


def desactiver(db: Session, utilisateur: Utilisateur) -> Utilisateur:
    """Le RSI ne supprime pas un compte : il le desactive (traçabilite conservee)."""
    utilisateur.actif = False
    db.commit()
    db.refresh(utilisateur)
    return utilisateur
