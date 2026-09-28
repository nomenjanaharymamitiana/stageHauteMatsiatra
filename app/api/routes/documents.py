from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import exiger_role_rsi
from app.crud import document as crud_document
from app.crud import journal as crud_journal
from app.db.session import get_db
from app.models.utilisateur import Utilisateur
from app.schemas.document import DocumentOut

router = APIRouter(
    prefix="/api/v1/rsi/documents",
    tags=["RSI - Documents"],
    dependencies=[Depends(exiger_role_rsi)],
)


@router.get("/corbeille", response_model=list[DocumentOut])
def lister_documents_supprimes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud_document.lister_supprimes(db, skip=skip, limit=limit)


@router.post("/{num_ref}/restaurer", response_model=DocumentOut)
def restaurer_document(
    num_ref: str, db: Session = Depends(get_db),
    rsi_courant: Utilisateur = Depends(exiger_role_rsi),
):
    """Cas d'utilisation : Restaurer doc."""
    document = crud_document.restaurer_document(db, num_ref)
    crud_journal.enregistrer_action(
        db, im_user=rsi_courant.im,
        description=f"Restauration du document {num_ref} par le RSI",
        num_ref_doc=num_ref,
    )
    return document
