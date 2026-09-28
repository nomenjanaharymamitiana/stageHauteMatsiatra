from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import exiger_role_rsi
from app.crud import journal as crud_journal
from app.db.session import get_db
from app.schemas.journal import JournalOut

router = APIRouter(
    prefix="/api/v1/rsi/journal",
    tags=["RSI - Journal"],
    dependencies=[Depends(exiger_role_rsi)],
)


@router.get("/", response_model=list[JournalOut])
def consulter_journal(
    date_debut: date | None = None,
    date_fin: date | None = None,
    im_user: str | None = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """Cas d'utilisation : Consulter Log."""
    return crud_journal.lister(db, date_debut=date_debut, date_fin=date_fin,
                                im_user=im_user, skip=skip, limit=limit)
