from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import exiger_role_rsi
from app.crud import document as crud_document
from app.crud import journal as crud_journal
from app.db.session import get_db
from app.models.utilisateur import Utilisateur
from app.schemas.document import DocumentLecture

router = APIRouter(
    prefix="/rsi/documents",
    tags=["RSI - Documents"],
    dependencies=[Depends(exiger_role_rsi)],
)


@router.get("/supprimes", response_model=list[DocumentLecture])
def lister_documents_supprimes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Documents en corbeille, en attente d'une eventuelle restauration."""
    return crud_document.lister_supprimes(db, skip=skip, limit=limit)


@router.post("/{document_id}/restaurer", response_model=DocumentLecture)
def restaurer_document(
    document_id: int,
    db: Session = Depends(get_db),
    rsi_courant: Utilisateur = Depends(exiger_role_rsi),
):
    """Cas d'utilisation : Restaurer doc."""
    document = crud_document.obtenir_par_id(db, document_id)
    if document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document introuvable")
    if not document.est_supprime:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ce document n'est pas dans la corbeille",
        )

    document = crud_document.restaurer(db, document)

    crud_journal.enregistrer_action(
        db,
        utilisateur_id=rsi_courant.id,
        description=f"Restauration du document {document.num_ref} par le RSI",
        document_id=document.id,
    )
    return document
