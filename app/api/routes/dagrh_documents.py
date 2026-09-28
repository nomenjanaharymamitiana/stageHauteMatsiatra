import os
from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.deps import exiger_role_dagrh
from app.core.aide_ia import extraire_texte, suggerer_classification
from app.crud import document as crud_document
from app.crud import journal as crud_journal
from app.db.session import get_db
from app.models.utilisateur import Utilisateur
from app.schemas.document import DocumentOut

router = APIRouter(prefix="/api/v1/documents", tags=["DAG_RH - Documents"])


@router.post("/aide-ia")
async def aide_ia_remplissage(
    file: UploadFile = File(...),
    dagrh_courant: Utilisateur = Depends(exiger_role_dagrh),
):
    """Analyse le fichier avant televersement pour pre-remplir le formulaire."""
    texte = await extraire_texte(file)
    return suggerer_classification(texte)


@router.post("/upload", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
async def upload_document(
    num_ref: str = Form(...),
    date_num: date = Form(...),
    cat: str = Form(...),
    annee_redac: date = Form(...),
    title: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    dagrh_courant: Utilisateur = Depends(exiger_role_dagrh),
):
    """
    Cas d'utilisation : Televerser doc.

    Difference avec le backend DAG d'origine : "im_dag_rh" n'est plus un
    champ de formulaire (donc non falsifiable par le client) ; il est deduit
    de l'utilisateur authentifie par le token JWT.
    """
    document = crud_document.create_document(
        db=db,
        num_ref=num_ref,
        date_num=date_num,
        cat=cat,
        annee_redac=annee_redac,
        title=title,
        im_dag_rh=dagrh_courant.im,
        file=file,
    )
    crud_journal.enregistrer_action(
        db, im_user=dagrh_courant.im,
        description=f"Ajout du document {num_ref} par l'agent {dagrh_courant.im}",
        num_ref_doc=num_ref,
    )
    return document


@router.get("/search", response_model=List[DocumentOut])
def search_documents(
    num_ref: Optional[str] = None,
    cat: Optional[str] = None,
    annee_redac: Optional[date] = None,
    file_format: Optional[str] = None,
    title: Optional[str] = None,
    db: Session = Depends(get_db),
    dagrh_courant: Utilisateur = Depends(exiger_role_dagrh),
):
    """Cas d'utilisation : Rechercher doc / Consulter."""
    return crud_document.search_documents(
        db=db, num_ref=num_ref, cat=cat, annee_redac=annee_redac,
        file_format=file_format, title=title,
    )


@router.get("/", response_model=List[DocumentOut])
def list_documents(
    skip: int = 0, limit: int = 50,
    db: Session = Depends(get_db),
    dagrh_courant: Utilisateur = Depends(exiger_role_dagrh),
):
    return crud_document.get_all_documents(db=db, skip=skip, limit=limit)


@router.get("/{num_ref}/preview")
def preview_document(
    num_ref: str, db: Session = Depends(get_db),
    dagrh_courant: Utilisateur = Depends(exiger_role_dagrh),
):
    """Cas d'utilisation : Consulter/lire doc (affichage dans le navigateur)."""
    doc = crud_document.get_document_by_ref(db, num_ref)
    if not doc or doc.est_supprime or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="Document introuvable sur le serveur.")
    return FileResponse(path=doc.file_path, headers={"Content-Disposition": "inline"})


@router.get("/{num_ref}/download")
def download_document(
    num_ref: str, db: Session = Depends(get_db),
    dagrh_courant: Utilisateur = Depends(exiger_role_dagrh),
):
    """Cas d'utilisation : Imprimer/Telecharger."""
    doc = crud_document.get_document_by_ref(db, num_ref)
    if not doc or doc.est_supprime or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="Document introuvable sur le serveur.")

    crud_journal.enregistrer_action(
        db, im_user=dagrh_courant.im,
        description=f"Telechargement du document {num_ref}",
        num_ref_doc=num_ref,
    )

    filename = os.path.basename(doc.file_path)
    return FileResponse(path=doc.file_path, filename=filename,
                         headers={"Content-Disposition": f"attachment; filename={filename}"})


@router.delete("/{num_ref}", response_model=DocumentOut)
def delete_document(
    num_ref: str, db: Session = Depends(get_db),
    dagrh_courant: Utilisateur = Depends(exiger_role_dagrh),
):
    """Cas d'utilisation : Document.supprimer_doc() (desormais suppression logique)."""
    document = crud_document.delete_document(db, num_ref)
    crud_journal.enregistrer_action(
        db, im_user=dagrh_courant.im,
        description=f"Suppression du document {num_ref}",
        num_ref_doc=num_ref,
    )
    return document
