from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import exiger_role_rsi
from app.crud import journal as crud_journal
from app.db.session import get_db
from app.schemas.journal import JournalLecture

router = APIRouter(
    prefix="/rsi/journal",
    tags=["RSI - Journal"],
    dependencies=[Depends(exiger_role_rsi)],
)


@router.get("/", response_model=list[JournalLecture])
def consulter_journal(
    date_debut: datetime | None = None,
    date_fin: datetime | None = None,
    utilisateur_id: int | None = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """
    Cas d'utilisation : Consulter Log.
    Les parametres date_debut/date_fin correspondent a Journal.Filtrer_par_date().
    """
    return crud_journal.lister(
        db,
        date_debut=date_debut,
        date_fin=date_fin,
        utilisateur_id=utilisateur_id,
        skip=skip,
        limit=limit,
    )
