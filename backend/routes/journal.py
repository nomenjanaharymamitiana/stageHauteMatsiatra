from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
import schemas
from crud import journal as crud_journal

router = APIRouter(prefix="/api/v1/journal", tags=["Journal"])

@router.get("/", response_model=List[schemas.JournalOut])
def list_journal(
    date_action: Optional[date] = None,
    im_user: Optional[str] = None,
    num_ref_doc: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Consulter le journal de bord.
    - **date_action**: Filtrer par date (YYYY-MM-DD)
    - **im_user**: Filtrer par le matricule de l'utilisateur
    - **num_ref_doc**: Filtrer par la référence du document
    """
    return crud_journal.get_journals(
        db=db,
        date_action=date_action,
        im_user=im_user,
        num_ref_doc=num_ref_doc,
        skip=skip,
        limit=limit
    )