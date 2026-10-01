from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import exiger_role_rsi
from app.crud import utilisateur as crud_utilisateur
from app.db.session import get_db
from app.schemas.utilisateur import UtilisateurCreation, UtilisateurLecture, UtilisateurMiseAJour

router = APIRouter(
    prefix="/rsi/utilisateurs",
    tags=["RSI - Gestion des utilisateurs"],
    dependencies=[Depends(exiger_role_rsi)],
)


@router.get("/", response_model=list[UtilisateurLecture])
def lister_utilisateurs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Cas d'utilisation : Gerer les comptes des utilisateurs (lecture)."""
    return crud_utilisateur.lister(db, skip=skip, limit=limit)


@router.get("/{utilisateur_id}", response_model=UtilisateurLecture)
def obtenir_utilisateur(utilisateur_id: int, db: Session = Depends(get_db)):
    utilisateur = crud_utilisateur.obtenir_par_id(db, utilisateur_id)
    if utilisateur is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur introuvable")
    return utilisateur


@router.post("/", response_model=UtilisateurLecture, status_code=status.HTTP_201_CREATED)
def creer_utilisateur(payload: UtilisateurCreation, db: Session = Depends(get_db)):
    """Cas d'utilisation : Gerer les comptes des utilisateurs (creation)."""
    if crud_utilisateur.obtenir_par_identifiant(db, payload.identifiant) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cet identifiant est deja utilise",
        )
    return crud_utilisateur.creer(db, payload)


@router.put("/{utilisateur_id}", response_model=UtilisateurLecture)
def mettre_a_jour_utilisateur(
    utilisateur_id: int, payload: UtilisateurMiseAJour, db: Session = Depends(get_db)
):
    """
    Cas d'utilisation : Gerer acces et roles (le champ 'role' peut etre modifie ici,
    ex. faire passer un compte de DAG_RH a RSI ou inversement).
    """
    utilisateur = crud_utilisateur.obtenir_par_id(db, utilisateur_id)
    if utilisateur is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur introuvable")
    return crud_utilisateur.mettre_a_jour(db, utilisateur, payload)


@router.patch("/{utilisateur_id}/desactiver", response_model=UtilisateurLecture)
def desactiver_utilisateur(utilisateur_id: int, db: Session = Depends(get_db)):
    """
    Desactivation d'un compte (au lieu d'une suppression definitive, pour garder
    la tracabilite dans le Journal).
    """
    utilisateur = crud_utilisateur.obtenir_par_id(db, utilisateur_id)
    if utilisateur is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur introuvable")
    return crud_utilisateur.desactiver(db, utilisateur)
