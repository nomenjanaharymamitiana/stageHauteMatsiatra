from pydantic import BaseModel
from datetime import date
from typing import Optional

class DocumentBase(BaseModel):
    num_ref: str
    date_num: date
    format: str
    cat: str
    annee_redac: str
    title: str = "Sans titre"

class DocumentCreate(DocumentBase):
    pass

class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    cat: Optional[str] = None
    annee_redac: Optional[str] = None

class DocumentOut(DocumentBase):
    file_path: str
    im_dag_rh: Optional[str] = None
    est_sup: bool = False

    class Config:
        from_attributes = True

class SearchFilter(BaseModel):
    num_ref: Optional[str] = None
    cat: Optional[str] = None
    annee_redac: Optional[str] = None  
    format: Optional[str] = None
    title: Optional[str] = None