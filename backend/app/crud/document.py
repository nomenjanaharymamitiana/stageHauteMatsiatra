from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.document import CategorieDocument, Document


def obtenir_par_id(db: Session, document_id: int) -> Document | None:
    return db.get(Document, document_id)


def lister_supprimes(db: Session, skip: int = 0, limit: int = 100) -> list[Document]:
    """Documents actuellement en corbeille (est_supprime=True), pour le RSI."""
    requete = (
        select(Document)
        .where(Document.est_supprime.is_(True))
        .offset(skip)
        .limit(limit)
    )
    return list(db.scalars(requete))


def restaurer(db: Session, document: Document) -> Document:
    """Cas d'utilisation RSI : Restaurer doc."""
    document.est_supprime = False
    db.commit()
    db.refresh(document)
    return document


def creer(
    db: Session,
    num_ref: str,
    date_num: date,
    format: str,
    cat: CategorieDocument,
    annee_redac: date,
    chemin_fichier: str,
    ajoute_par_id: int,
) -> Document:
    """Cas d'utilisation DAG/RH : Televerser doc (Document.importer())."""
    document = Document(
        num_ref=num_ref,
        date_num=date_num,
        format=format,
        cat=cat,
        annee_redac=annee_redac,
        chemin_fichier=chemin_fichier,
        ajoute_par_id=ajoute_par_id,
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return document


def rechercher(
    db: Session,
    q: str | None = None,
    cat: CategorieDocument | None = None,
    format: str | None = None,
    annee: int | None = None,
    inclure_supprimes: bool = False,
    skip: int = 0,
    limit: int = 100,
) -> list[Document]:
    """Cas d'utilisation DAG/RH : Rechercher doc / Consulter (liste filtree)."""
    requete = select(Document)

    if not inclure_supprimes:
        requete = requete.where(Document.est_supprime.is_(False))
    if q:
        requete = requete.where(Document.num_ref.ilike(f"%{q}%"))
    if cat is not None:
        requete = requete.where(Document.cat == cat)
    if format:
        requete = requete.where(Document.format == format)
    if annee is not None:
        requete = requete.where(
            Document.annee_redac >= date(annee, 1, 1),
            Document.annee_redac <= date(annee, 12, 31),
        )

    requete = requete.order_by(Document.id.desc()).offset(skip).limit(limit)
    return list(db.scalars(requete))


def supprimer(db: Session, document: Document) -> Document:
    """
    Cas d'utilisation DAG/RH : Document.supprimer_doc().
    Suppression logique uniquement (soft-delete) : le RSI peut la restaurer.
    """
    document.est_supprime = True
    db.commit()
    db.refresh(document)
    return document
