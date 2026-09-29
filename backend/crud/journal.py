
from datetime import date
from typing import List, Optional
from sqlalchemy.orm import Session
import models

def get_journals(
    db: Session,
    date_action: Optional[date] = None,
    im_user: Optional[str] = None,
    num_ref_doc: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
) -> List[models.Journal]:
    """Récupère les entrées du journal filtrées par date, utilisateur ou document."""
    query = db.query(models.Journal)

    if date_action:
        query = query.filter(models.Journal.date_action == date_action)
    if im_user:
        query = query.filter(models.Journal.im_user == im_user)
    if num_ref_doc:
        query = query.filter(models.Journal.num_ref_doc == num_ref_doc)

    return (
        query.order_by(models.Journal.date_action.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )