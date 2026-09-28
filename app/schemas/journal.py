from datetime import date
from typing import Optional

from pydantic import BaseModel


class JournalOut(BaseModel):
    id_jour: str
    date_action: date
    desc: Optional[str] = None
    im_user: str
    num_ref_doc: Optional[str] = None

    class Config:
        from_attributes = True
