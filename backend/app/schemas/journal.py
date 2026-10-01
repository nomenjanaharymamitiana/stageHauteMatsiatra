from datetime import datetime

from pydantic import BaseModel, ConfigDict


class JournalLecture(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    date_action: datetime
    desc: str
    utilisateur_id: int
    document_id: int | None
