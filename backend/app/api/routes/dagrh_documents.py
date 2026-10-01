import shutil
import uuid
from datetime import date
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.deps import exiger_role_dagrh
from app.core.aide_ia import extraire_texte, suggerer_classification
from app.core.config import settings
from app.crud import document as crud_document
from app.crud import journal as crud_journal
from app.db.session import get_db
from app.models.document import CategorieDocument
from app.models.utilisateur import Utilisateur
from app.schemas.document import DocumentLecture

router = APIRouter(
    prefix="/documents",
    tags=["DAG_RH - Documents"],
    dependencies=[Depends(exiger_role_dagrh)],
)

STORAGE_DIR = Path(settings.STORAGE_DIR)
STORAGE_DIR.mkdir(parents=True, exist_ok=True)

EXTENSIONS_AUTORISEES = {"pdf", "docx", "doc", "xlsx", "xls", "png", "jpg", "jpeg"}


@router.post("/aide-ia")
async def aide_ia_remplissage(fichier: UploadFile = File(...)):
    """
    Analyse le fichier avant televersement et suggere une categorie, une date
    et un resume pour pre-remplir le formulaire (le RSI/DAG_RH valide ensuite).
    """
    texte = await extraire_texte(fichier)
    return suggerer_classification(texte)



@router.get("/", response_model=list[DocumentLecture])
def rechercher_documents(
    q: str | None = None,
    cat: CategorieDocument | None = None,
    format: str | None = None,
    annee: int | None = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """Cas d'utilisation : Consulter + Rechercher doc (q filtre sur le numero de reference)."""
    return crud_document.rechercher(
        db, q=q, cat=cat, format=format, annee=annee, skip=skip, limit=limit
    )


@router.get("/{document_id}", response_model=DocumentLecture)
def consulter_document(document_id: int, db: Session = Depends(get_db)):
    """Cas d'utilisation : Consulter/lire doc."""
    document = crud_document.obtenir_par_id(db, document_id)
    if document is None or document.est_supprime:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document introuvable")
    return document


@router.post("/", response_model=DocumentLecture, status_code=status.HTTP_201_CREATED)
def televerser_document(
    num_ref: str = Form(...),
    format: str = Form(...),
    cat: CategorieDocument = Form(...),
    annee_redac: date = Form(...),
    date_num: date = Form(...),
    fichier: UploadFile = File(...),
    db: Session = Depends(get_db),
    dagrh_courant: Utilisateur = Depends(exiger_role_dagrh),
):
    """Cas d'utilisation : Televerser doc (Document.importer())."""
    extension = fichier.filename.rsplit(".", 1)[-1].lower() if "." in fichier.filename else ""
    if extension not in EXTENSIONS_AUTORISEES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Extension .{extension} non autorisee",
        )

    nom_fichier_stocke = f"{uuid.uuid4().hex}.{extension}"
    chemin_disque = STORAGE_DIR / nom_fichier_stocke

    with chemin_disque.open("wb") as buffer:
        shutil.copyfileobj(fichier.file, buffer)

    document = crud_document.creer(
        db,
        num_ref=num_ref,
        date_num=date_num,
        format=format,
        cat=cat,
        annee_redac=annee_redac,
        chemin_fichier=str(chemin_disque),
        ajoute_par_id=dagrh_courant.id,
    )

    crud_journal.enregistrer_action(
        db,
        utilisateur_id=dagrh_courant.id,
        description=f"Televersement du document {document.num_ref}",
        document_id=document.id,
    )
    return document


@router.get("/{document_id}/telecharger")
def telecharger_document(
    document_id: int,
    db: Session = Depends(get_db),
    dagrh_courant: Utilisateur = Depends(exiger_role_dagrh),
):
    """
    Cas d'utilisation : Imprimer/Telecharger.
    Le fichier telecharge peut ensuite etre imprime depuis le navigateur (ou le
    lecteur PDF) de l'utilisateur ; il n'y a pas d'impression serveur distincte.
    """
    document = crud_document.obtenir_par_id(db, document_id)
    if document is None or document.est_supprime:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document introuvable")

    chemin = Path(document.chemin_fichier)
    if not chemin.exists():
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="Fichier introuvable sur le serveur")

    crud_journal.enregistrer_action(
        db,
        utilisateur_id=dagrh_courant.id,
        description=f"Telechargement du document {document.num_ref}",
        document_id=document.id,
    )

    nom_telecharge = f"{document.num_ref}.{document.format}"
    return FileResponse(path=chemin, filename=nom_telecharge)


@router.delete("/{document_id}", response_model=DocumentLecture)
def supprimer_document(
    document_id: int,
    db: Session = Depends(get_db),
    dagrh_courant: Utilisateur = Depends(exiger_role_dagrh),
):
    """Cas d'utilisation : Document.supprimer_doc() (suppression logique)."""
    document = crud_document.obtenir_par_id(db, document_id)
    if document is None or document.est_supprime:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document introuvable")

    document = crud_document.supprimer(db, document)

    crud_journal.enregistrer_action(
        db,
        utilisateur_id=dagrh_courant.id,
        description=f"Suppression du document {document.num_ref}",
        document_id=document.id,
    )
    return document
