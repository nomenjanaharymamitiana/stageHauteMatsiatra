from pydantic import BaseModel
from datetime import date
from typing import Optional

class DocumentBase(BaseModel):
    num_ref: str
    date_num: date
    format: str
    cat: str
    annee_redac: date
    title: str

class DocumentCreate(DocumentBase):
    pass

# Schéma pour la mise à jour (tous les champs modifiables sont optionnels)
class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    cat: Optional[str] = None
    annee_redac: Optional[date] = None

class DocumentOut(DocumentBase):
    file_path: str
    im_dag_rh: Optional[str] = None

    class Config:
        from_attributes = True

class SearchFilter(BaseModel):
    num_ref: Optional[str] = None
    cat: Optional[str] = None
    annee_redac: Optional[date] = None  
    format: Optional[str] = None
    title: Optional[str] = None