from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.journal import Journal


def lister(
    db: Session,
    date_debut: datetime | None = None,
    date_fin: datetime | None = None,
    utilisateur_id: int | None = None,
    skip: int = 0,
    limit: int = 100,
) -> list[Journal]:
    """Cas d'utilisation RSI : Consulter Log, avec filtre par date (Filtrer_par_date)."""
    requete = select(Journal).order_by(Journal.date_action.desc())

    if date_debut is not None:
        requete = requete.where(Journal.date_action >= date_debut)
    if date_fin is not None:
        requete = requete.where(Journal.date_action <= date_fin)
    if utilisateur_id is not None:
        requete = requete.where(Journal.utilisateur_id == utilisateur_id)

    requete = requete.offset(skip).limit(limit)
    return list(db.scalars(requete))


def enregistrer_action(
    db: Session, utilisateur_id: int, description: str, document_id: int | None = None
) -> Journal:
    """Equivalent de Journal.enregistrerAction() dans le diagramme de classes."""
    entree = Journal(
        date_action=datetime.utcnow(),
        desc=description,
        utilisateur_id=utilisateur_id,
        document_id=document_id,
    )
    db.add(entree)
    db.commit()
    db.refresh(entree)
    return entree
