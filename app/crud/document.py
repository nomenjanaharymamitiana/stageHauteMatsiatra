import os
import shutil
from datetime import date
from pathlib import Path
from typing import Optional

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.document import Document
from app.models.utilisateur import DAG_RH

UPLOAD_DIR = Path(settings.STORAGE_DIR)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def get_agent_dag_rh(db: Session, im_dag_rh: str) -> DAG_RH | None:
    return db.get(DAG_RH, im_dag_rh)


def get_document_by_ref(db: Session, num_ref: str) -> Document | None:
    return db.get(Document, num_ref)


def create_document(
    db: Session,
    num_ref: str,
    date_num: date,
    cat: str,
    annee_redac: date,
    title: str,
    im_dag_rh: str,
    file: UploadFile,
) -> Document:
    """Cas d'utilisation : Televerser doc (import(), notation DAG conservee)."""
    if get_document_by_ref(db, num_ref):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un document avec cette reference existe deja.",
        )

    file_ext = file.filename.split(".")[-1].lower() if "." in file.filename else "inconnu"
    file_name = f"{num_ref}_{file.filename}"
    saved_path = UPLOAD_DIR / file_name

    with saved_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    new_doc = Document(
        num_ref=num_ref,
        date_num=date_num,
        format=file_ext,
        cat=cat,
        annee_redac=annee_redac,
        title=title,
        file_path=str(saved_path),
        im_dag_rh=im_dag_rh,
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    return new_doc


def search_documents(
    db: Session,
    num_ref: Optional[str] = None,
    cat: Optional[str] = None,
    annee_redac: Optional[date] = None,
    file_format: Optional[str] = None,
    title: Optional[str] = None,
    inclure_supprimes: bool = False,
) -> list[Document]:
    requete = select(Document)

    if not inclure_supprimes:
        requete = requete.where(Document.est_supprime.is_(False))
    if num_ref:
        requete = requete.where(Document.num_ref.ilike(f"%{num_ref}%"))
    if cat:
        requete = requete.where(Document.cat == cat)
    if annee_redac:
        requete = requete.where(Document.annee_redac == annee_redac)
    if file_format:
        requete = requete.where(Document.format == file_format.lower())
    if title:
        requete = requete.where(Document.title.ilike(f"%{title}%"))

    return list(db.scalars(requete))


def get_all_documents(db: Session, skip: int = 0, limit: int = 50) -> list[Document]:
    requete = (
        select(Document)
        .where(Document.est_supprime.is_(False))
        .order_by(Document.date_num.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(db.scalars(requete))


def delete_document(db: Session, num_ref: str) -> Document:
    """
    Cas d'utilisation : Document.supprimer_doc().

    Notation DAG conservee (num_ref, fichier physique...), mais suppression
    rendue LOGIQUE (est_supprime=True) au lieu de physique : le backend DAG
    d'origine supprimait le fichier et la ligne definitivement, ce qui rend
    la restauration RSI impossible. Le fichier physique est conserve tant
    que le document n'est pas restaure ou purge definitivement.
    """
    doc = get_document_by_ref(db, num_ref)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document non trouve.")
    if doc.est_supprime:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Document deja supprime.")

    doc.est_supprime = True
    db.commit()
    db.refresh(doc)
    return doc


def lister_supprimes(db: Session, skip: int = 0, limit: int = 100) -> list[Document]:
    requete = (
        select(Document)
        .where(Document.est_supprime.is_(True))
        .offset(skip)
        .limit(limit)
    )
    return list(db.scalars(requete))


def restaurer_document(db: Session, num_ref: str) -> Document:
    """Cas d'utilisation RSI : Restaurer doc."""
    doc = get_document_by_ref(db, num_ref)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document non trouve.")
    if not doc.est_supprime:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ce document n'est pas dans la corbeille.")

    doc.est_supprime = False
    db.commit()
    db.refresh(doc)
    return doc
