from datetime import date

from pydantic import BaseModel, ConfigDict

from app.models.document import CategorieDocument


class DocumentLecture(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    num_ref: str
    date_num: date
    format: str
    cat: CategorieDocument
    annee_redac: date
    chemin_fichier: str
    est_supprime: bool
    ajoute_par_id: int


class DocumentCreation(BaseModel):
    """Metadonnees envoyees en meme temps que le fichier lors du televersement."""
    num_ref: str
    format: str
    cat: CategorieDocument
    annee_redac: date
    date_num: date
