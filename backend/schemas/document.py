from pydantic import BaseModel
from datetime import date
from typing import Optional

class DocumentBase(BaseModel):
    num_ref: str
    date_num: date
    format: str
    cat: str
    annee_redac: date  # Modifié de int vers date
    title: str

class DocumentCreate(DocumentBase):
    pass

class DocumentOut(DocumentBase):
    file_path: str
    # Le champ created_at a été retiré car il n'existe pas dans le modèle Document

    class Config:
        from_attributes = True

class SearchFilter(BaseModel):
    num_ref: Optional[str] = None
    cat: Optional[str] = None
    annee_redac: Optional[date] = None  
    format: Optional[str] = None
    title: Optional[str] = None