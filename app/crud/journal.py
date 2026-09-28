import uuid
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.journal import Journal


def enregistrer_action(
    db: Session, im_user: str, description: str, num_ref_doc: str | None = None
) -> Journal:
    entree = Journal(
        id_jour=str(uuid.uuid4()),
        date_action=date.today(),
        desc=description,
        im_user=im_user,
        num_ref_doc=num_ref_doc,
    )
    db.add(entree)
    db.commit()
    db.refresh(entree)
    return entree


def lister(
    db: Session,
    date_debut: date | None = None,
    date_fin: date | None = None,
    im_user: str | None = None,
    skip: int = 0,
    limit: int = 100,
) -> list[Journal]:
    """Cas d'utilisation RSI : Consulter Log (Filtrer_par_date)."""
    requete = select(Journal).order_by(Journal.date_action.desc())

    if date_debut is not None:
        requete = requete.where(Journal.date_action >= date_debut)
    if date_fin is not None:
        requete = requete.where(Journal.date_action <= date_fin)
    if im_user is not None:
        requete = requete.where(Journal.im_user == im_user)

    requete = requete.offset(skip).limit(limit)
    return list(db.scalars(requete))
