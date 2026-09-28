from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import exiger_role_rsi
from app.crud import utilisateur as crud_utilisateur
from app.db.session import get_db
from app.schemas.auth import UserOut
from app.schemas.utilisateur import RoleMiseAJour, UtilisateurCreation

router = APIRouter(
    prefix="/api/v1/rsi/utilisateurs",
    tags=["RSI - Utilisateurs"],
    dependencies=[Depends(exiger_role_rsi)],
)


@router.get("/", response_model=list[UserOut])
def lister_utilisateurs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Cas d'utilisation : Gerer les comptes des utilisateurs (lecture)."""
    return crud_utilisateur.lister(db, skip=skip, limit=limit)


@router.post("/", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def creer_utilisateur(payload: UtilisateurCreation, db: Session = Depends(get_db)):
    """Cas d'utilisation : Gerer les comptes des utilisateurs (creation)."""
    if crud_utilisateur.get_by_im(db, payload.im) is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Cet identifiant (im) est deja utilise")
    try:
        return crud_utilisateur.creer(db, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))


@router.patch("/{im}/role", response_model=UserOut)
def changer_role(im: str, payload: RoleMiseAJour, db: Session = Depends(get_db)):
    """Cas d'utilisation : Gerer acces et roles."""
    try:
        return crud_utilisateur.changer_role(db, im, payload.type_user)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.patch("/{im}/desactiver", response_model=UserOut)
def desactiver(im: str, db: Session = Depends(get_db)):
    try:
        return crud_utilisateur.changer_statut_actif(db, im, actif=False)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.patch("/{im}/activer", response_model=UserOut)
def activer(im: str, db: Session = Depends(get_db)):
    try:
        return crud_utilisateur.changer_statut_actif(db, im, actif=True)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
